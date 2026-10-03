import { HttpResponse } from "msw";
import { revalidateTag } from "next/cache";
import { describe, expect, test } from "vitest";
import { syncShowcase, syncShowcaseData } from "@/lib/sync/sync-showcase";
import { createShowcaseProject, testPrisma } from "@test/db";
import { fakeGraphQL, fakeShowcaseRegistry, type FakeRegistryFile } from "@test/github";

function repoData(stars: number) {
  return {
    stargazerCount: stars,
    forkCount: 3,
    issues: { totalCount: 4 },
    pullRequests: { totalCount: 2 },
    description: `Repo with ${stars} stars`,
    homepageUrl: "https://example.dev",
    licenseInfo: { spdxId: "MIT" },
    primaryLanguage: { name: "TypeScript", color: "#3178c6" },
  };
}

/** Fake GitHub GraphQL that knows the given repos (`owner/name` -> stars). */
function fakeRepos(stars: Record<string, number>, intercept?: (i: number) => HttpResponse<null> | undefined) {
  return fakeGraphQL({
    field: "repository",
    resolve: ({ owner, name }) => {
      const count = stars[`${owner}/${name}`];
      return count === undefined ? null : repoData(count);
    },
    intercept,
  });
}

function yamlFile(repo: string, sha: string, extra = ""): FakeRegistryFile {
  return { name: `${repo.replace("/", "-")}.yaml`, sha, content: `repo: ${repo}\nsubmittedBy: octocat\n${extra}` };
}

describe("syncShowcase", () => {
  test("creates projects from the registry with registry and GitHub fields", async () => {
    fakeShowcaseRegistry([
      yamlFile(
        "acme/rocket",
        "sha-1",
        "banner: https://example.com/banner.png\nlinks:\n  - https://www.npmjs.com/package/rocket\nwebsite: https://rocket.dev\n",
      ),
    ]);
    fakeRepos({ "acme/rocket": 1234 });

    await expect(syncShowcase()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0 });

    expect(await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).toMatchObject({
      submittedBy: "octocat",
      banner: "https://example.com/banner.png",
      links: ["https://www.npmjs.com/package/rocket"],
      website: "https://rocket.dev",
      fileSha: "sha-1",
      stars: 1234,
      forks: 3,
      openIssues: 4,
      openPRs: 2,
      description: "Repo with 1234 stars",
      homepageUrl: "https://example.dev",
      license: "MIT",
      language: "TypeScript",
      languageColor: "#3178c6",
    });
    expect(revalidateTag).toHaveBeenCalledWith("showcase", "max");
  });

  test("defaults optional registry fields", async () => {
    fakeShowcaseRegistry([yamlFile("acme/minimal", "sha-1")]);
    fakeRepos({ "acme/minimal": 1 });

    await syncShowcase();

    expect(await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/minimal" } })).toMatchObject({
      banner: null,
      links: [],
      website: null,
    });
  });

  test("skips unchanged files without querying GitHub or busting the cache", async () => {
    await createShowcaseProject({ repo: "acme/rocket", fileSha: "sha-1", stars: 5 });
    fakeShowcaseRegistry([yamlFile("acme/rocket", "sha-1")]);
    const { queries } = fakeRepos({ "acme/rocket": 999 });

    await expect(syncShowcase()).resolves.toEqual({ synced: 0, skipped: 1, deleted: 0 });

    expect(queries).toHaveLength(0);
    expect((await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).stars).toBe(5);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test("updates a changed file in place, keeping its creation date", async () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const existing = await createShowcaseProject({ repo: "acme/rocket", fileSha: "old", createdAt });
    fakeShowcaseRegistry([yamlFile("acme/rocket", "new", "website: https://new.dev\n")]);
    fakeRepos({ "acme/rocket": 50 });

    await expect(syncShowcase()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0 });

    expect(await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).toMatchObject({
      id: existing.id,
      createdAt,
      fileSha: "new",
      website: "https://new.dev",
      stars: 50,
    });
  });

  test("deletes projects whose YAML was removed from the registry", async () => {
    await createShowcaseProject({ repo: "acme/kept", fileSha: "sha-1" });
    await createShowcaseProject({ repo: "acme/removed", fileSha: "sha-2" });
    fakeShowcaseRegistry([yamlFile("acme/kept", "sha-1")]);
    fakeRepos({});

    await expect(syncShowcase()).resolves.toEqual({ synced: 0, skipped: 1, deleted: 1 });

    expect((await testPrisma.showcaseProject.findMany()).map((p) => p.repo)).toEqual(["acme/kept"]);
    expect(revalidateTag).toHaveBeenCalledWith("showcase", "max");
  });

  test("never wipes the table when the registry comes back empty", async () => {
    await createShowcaseProject({ repo: "acme/kept" });
    fakeShowcaseRegistry([]);
    fakeRepos({});

    await expect(syncShowcase()).resolves.toEqual({ synced: 0, skipped: 0, deleted: 0 });
    expect(await testPrisma.showcaseProject.count()).toBe(1);
  });

  test("ignores non-YAML files and YAML that fails validation", async () => {
    fakeShowcaseRegistry([
      yamlFile("acme/valid", "sha-1"),
      { name: "README.md", sha: "readme", content: "# Showcase" },
      { name: "missing-submitter.yaml", sha: "sha-2", content: "repo: acme/invalid\n" },
      { name: "wrong-type.yaml", sha: "sha-3", content: "repo: acme/typed\nsubmittedBy: x\nlinks: not-a-list\n" },
    ]);
    fakeRepos({ "acme/valid": 1, "acme/invalid": 1, "acme/typed": 1 });

    await expect(syncShowcase()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0 });
    expect((await testPrisma.showcaseProject.findMany()).map((p) => p.repo)).toEqual(["acme/valid"]);
  });

  test("staggers new projects' creation dates in registry order, newest first", async () => {
    fakeShowcaseRegistry([yamlFile("acme/a", "1"), yamlFile("acme/b", "2"), yamlFile("acme/c", "3")]);
    fakeRepos({ "acme/a": 1, "acme/b": 1, "acme/c": 1 });

    await syncShowcase();

    const projects = await testPrisma.showcaseProject.findMany({ orderBy: { createdAt: "desc" } });
    expect(projects.map((p) => p.repo)).toEqual(["acme/a", "acme/b", "acme/c"]);
    const gaps = projects.slice(1).map((p, i) => projects[i].createdAt.getTime() - p.createdAt.getTime());
    expect(gaps).toEqual([10 * 60 * 1000, 10 * 60 * 1000]);
  });

  test("falls back to empty GitHub fields for a repo GitHub can't find", async () => {
    fakeShowcaseRegistry([yamlFile("acme/private", "1")]);
    fakeRepos({});

    await syncShowcase();

    expect(await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/private" } })).toMatchObject({
      stars: 0,
      forks: 0,
      license: null,
      language: null,
    });
  });

  test("batches GitHub lookups 50 repos at a time and keeps results aligned", async () => {
    const repos = Array.from({ length: 55 }, (_, i) => `acme/repo-${i}`);
    fakeShowcaseRegistry(repos.map((repo, i) => yamlFile(repo, `sha-${i}`)));
    const { queries, aliasesIn } = fakeRepos(Object.fromEntries(repos.map((repo, i) => [repo, i * 10])));

    await expect(syncShowcase()).resolves.toMatchObject({ synced: 55 });

    expect(queries.map((q) => aliasesIn(q).length).toSorted((a, b) => a - b)).toEqual([5, 50]);
    const stars = await testPrisma.showcaseProject.findMany({ select: { repo: true, stars: true } });
    for (const { repo, stars: count } of stars) {
      expect(count).toBe(Number(repo.split("-").at(-1)) * 10);
    }
  });

  // A single YAML edit that fails validation is filtered out of the registry, so the project is deleted.
  test.fails("BUG-07: keeps an existing project when its YAML becomes invalid", async () => {
    await createShowcaseProject({ repo: "acme/rocket", fileSha: "sha-1", stars: 100 });
    await createShowcaseProject({ repo: "acme/other", fileSha: "sha-2" });
    fakeShowcaseRegistry([
      { name: "acme-rocket.yaml", sha: "sha-1b", content: "repo: acme/rocket\nsubmitedBy: typo\n" },
      yamlFile("acme/other", "sha-2"),
    ]);
    fakeRepos({});

    await syncShowcase();

    expect(await testPrisma.showcaseProject.findUnique({ where: { repo: "acme/rocket" } })).not.toBeNull();
  });

  // `repo` is only `z.string()`, so a value without `owner/name` is queried as `name: "undefined"`.
  test.fails("BUG-08: rejects registry entries whose repo is not owner/name", async () => {
    fakeShowcaseRegistry([yamlFile("just-a-name", "1"), yamlFile("acme/valid", "2")]);
    fakeRepos({ "acme/valid": 1 });

    await syncShowcase();

    expect((await testPrisma.showcaseProject.findMany()).map((p) => p.repo)).toEqual(["acme/valid"]);
  });
});

describe("syncShowcaseData", () => {
  test("refreshes GitHub fields for every project, leaving registry fields alone", async () => {
    await testPrisma.showcaseProject.create({
      data: {
        repo: "acme/rocket",
        submittedBy: "octocat",
        banner: "https://example.com/b.png",
        links: ["https://crates.io/crates/rocket"],
        website: "https://rocket.dev",
        fileSha: "sha-1",
        stars: 1,
      },
    });
    fakeRepos({ "acme/rocket": 777 });

    await expect(syncShowcaseData()).resolves.toEqual({ synced: 1 });

    expect(await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).toMatchObject({
      stars: 777,
      license: "MIT",
      submittedBy: "octocat",
      banner: "https://example.com/b.png",
      links: ["https://crates.io/crates/rocket"],
      website: "https://rocket.dev",
      fileSha: "sha-1",
    });
    expect(revalidateTag).toHaveBeenCalledWith("showcase", "max");
  });

  test("returns early without querying GitHub when there are no projects", async () => {
    const { queries } = fakeRepos({});

    await expect(syncShowcaseData()).resolves.toEqual({ synced: 0 });
    expect(queries).toHaveLength(0);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test("propagates GitHub transport errors", async () => {
    await createShowcaseProject({ repo: "acme/rocket" });
    fakeRepos({}, () => new HttpResponse(null, { status: 502 }));

    await expect(syncShowcaseData()).rejects.toMatchObject({ status: 502 });
  });

  // GitHub answers a missing/renamed/temporarily unresolvable repo with `null`, which overwrites real stats with zeros.
  test.fails("BUG-06: keeps the last known stats when GitHub returns no data for a repo", async () => {
    await createShowcaseProject({ repo: "acme/rocket", stars: 1500 });
    fakeRepos({});

    await syncShowcaseData();

    expect((await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).stars).toBe(1500);
  });
});
