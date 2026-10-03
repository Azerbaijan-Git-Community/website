import { HttpResponse } from "msw";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
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

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

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

    await expect(syncShowcase()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, invalid: [] });

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

    await expect(syncShowcase()).resolves.toEqual({ synced: 0, skipped: 1, deleted: 0, invalid: [] });

    expect(queries).toHaveLength(0);
    expect((await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).stars).toBe(5);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test("updates a changed file in place, keeping its creation date", async () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const existing = await createShowcaseProject({ repo: "acme/rocket", fileSha: "old", createdAt });
    fakeShowcaseRegistry([yamlFile("acme/rocket", "new", "website: https://new.dev\n")]);
    fakeRepos({ "acme/rocket": 50 });

    await expect(syncShowcase()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, invalid: [] });

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

    await expect(syncShowcase()).resolves.toEqual({ synced: 0, skipped: 1, deleted: 1, invalid: [] });

    expect((await testPrisma.showcaseProject.findMany()).map((p) => p.repo)).toEqual(["acme/kept"]);
    expect(revalidateTag).toHaveBeenCalledWith("showcase", "max");
  });

  test("never wipes the table when the registry comes back empty", async () => {
    await createShowcaseProject({ repo: "acme/kept" });
    fakeShowcaseRegistry([]);
    fakeRepos({});

    await expect(syncShowcase()).resolves.toEqual({ synced: 0, skipped: 0, deleted: 0, invalid: [] });
    expect(await testPrisma.showcaseProject.count()).toBe(1);
  });

  test("skips non-YAML files and reports YAML that fails validation", async () => {
    fakeShowcaseRegistry([
      yamlFile("acme/valid", "sha-1"),
      { name: "README.md", sha: "readme", content: "# Showcase" },
      { name: "missing-submitter.yaml", sha: "sha-2", content: "repo: acme/invalid\n" },
      { name: "wrong-type.yaml", sha: "sha-3", content: "repo: acme/typed\nsubmittedBy: x\nlinks: not-a-list\n" },
    ]);
    fakeRepos({ "acme/valid": 1, "acme/invalid": 1, "acme/typed": 1 });

    await expect(syncShowcase()).resolves.toEqual({
      synced: 1,
      skipped: 0,
      deleted: 0,
      invalid: ["missing-submitter.yaml", "wrong-type.yaml"],
    });
    expect((await testPrisma.showcaseProject.findMany()).map((p) => p.repo)).toEqual(["acme/valid"]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid showcase file "wrong-type.yaml"'));
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

  test("BUG-07: keeps an existing project when its YAML becomes invalid", async () => {
    await createShowcaseProject({ repo: "acme/rocket", fileSha: "sha-1", stars: 100 });
    await createShowcaseProject({ repo: "acme/other", fileSha: "sha-2" });
    fakeShowcaseRegistry([
      { name: "acme-rocket.yaml", sha: "sha-1b", content: "repo: acme/rocket\nsubmitedBy: typo\n" },
      yamlFile("acme/other", "sha-2"),
    ]);
    fakeRepos({});

    await expect(syncShowcase()).resolves.toMatchObject({ deleted: 0, invalid: ["acme-rocket.yaml"] });

    expect(await testPrisma.showcaseProject.findUnique({ where: { repo: "acme/rocket" } })).toMatchObject({
      fileSha: "sha-1",
      stars: 100,
    });
  });

  test("skips pruning when a file is not even parseable YAML", async () => {
    await createShowcaseProject({ repo: "acme/rocket", fileSha: "sha-1" });
    fakeShowcaseRegistry([
      { name: "acme-rocket.yaml", sha: "sha-1b", content: "repo: [unclosed\n" },
      yamlFile("acme/other", "sha-2"),
    ]);
    fakeRepos({ "acme/other": 1 });

    await expect(syncShowcase()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, invalid: ["acme-rocket.yaml"] });
    expect(await testPrisma.showcaseProject.count()).toBe(2);
  });

  test("still prunes files deleted upstream alongside an invalid one", async () => {
    await createShowcaseProject({ repo: "acme/rocket", fileSha: "sha-1" });
    await createShowcaseProject({ repo: "acme/gone", fileSha: "sha-2" });
    fakeShowcaseRegistry([
      { name: "acme-rocket.yaml", sha: "sha-1b", content: "repo: acme/rocket\n" },
      yamlFile("acme/other", "sha-3"),
    ]);
    fakeRepos({ "acme/other": 1 });

    await expect(syncShowcase()).resolves.toMatchObject({ deleted: 1 });
    const repos = (await testPrisma.showcaseProject.findMany({ orderBy: { repo: "asc" } })).map((p) => p.repo);
    expect(repos).toEqual(["acme/other", "acme/rocket"]);
  });

  test("keeps stats when a changed file's repo has no GitHub data", async () => {
    await createShowcaseProject({ repo: "acme/rocket", fileSha: "sha-1", stars: 900 });
    fakeShowcaseRegistry([yamlFile("acme/rocket", "sha-2", "website: https://new.dev\n")]);
    fakeRepos({});

    await syncShowcase();

    expect(await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).toMatchObject({
      stars: 900,
      website: "https://new.dev",
      fileSha: "sha-2",
    });
  });

  test.for(["just-a-name", 'acme/rock"et', "acme/rocket/extra"])("BUG-08: rejects repo %j", async (repo) => {
    fakeShowcaseRegistry([yamlFile(repo, "1"), yamlFile("acme/valid", "2")]);
    fakeRepos({ "acme/valid": 1 });

    await expect(syncShowcase()).resolves.toMatchObject({ synced: 1, invalid: [`${repo.replace("/", "-")}.yaml`] });

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

  test("BUG-06: keeps the last known stats when GitHub returns no data for a repo", async () => {
    await createShowcaseProject({ repo: "acme/rocket", stars: 1500 });
    await createShowcaseProject({ repo: "acme/live", stars: 1 });
    fakeRepos({ "acme/live": 42 });

    await expect(syncShowcaseData()).resolves.toEqual({ synced: 1 });

    expect((await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/rocket" } })).stars).toBe(1500);
    expect((await testPrisma.showcaseProject.findUniqueOrThrow({ where: { repo: "acme/live" } })).stars).toBe(42);
    expect(console.warn).toHaveBeenCalledWith('No GitHub data for showcase repo "acme/rocket", keeping existing stats');
  });
});
