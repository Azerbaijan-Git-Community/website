import { describe, expect, test } from "vitest";
import { POST } from "@/app/api/webhooks/showcase/route";
import { createShowcaseProject, testPrisma } from "@test/db";
import { fakeGraphQL, fakeShowcaseRegistry } from "@test/github";
import { request } from "@test/request";

function post(authorization?: string) {
  return POST(request("/api/webhooks/showcase", { method: "POST", headers: authorization ? { authorization } : {} }));
}

describe("POST /api/webhooks/showcase", () => {
  test("rejects callers without the showcase webhook secret", async () => {
    expect((await post()).status).toBe(401);
    expect((await post("Bearer test-blog-secret")).status).toBe(401);
  });

  test("syncs the registry and summarizes the run", async () => {
    await createShowcaseProject({ repo: "acme/same", fileSha: "s1" });
    await createShowcaseProject({ repo: "acme/gone", fileSha: "s2" });
    fakeShowcaseRegistry([
      { name: "same.yaml", sha: "s1", content: "repo: acme/same\nsubmittedBy: a\n" },
      { name: "new.yaml", sha: "s3", content: "repo: acme/new\nsubmittedBy: b\n" },
    ]);
    fakeGraphQL({ field: "repository", resolve: () => null });

    const res = await post("Bearer test-showcase-secret");

    await expect(res.json()).resolves.toEqual({
      ok: true,
      synced: 1,
      skipped: 1,
      deleted: 1,
      invalid: [],
      message: "Synced 1 projects, skipped 1 unchanged, deleted 1, invalid 0",
    });
    const repos = (await testPrisma.showcaseProject.findMany({ orderBy: { repo: "asc" } })).map((p) => p.repo);
    expect(repos).toEqual(["acme/new", "acme/same"]);
  });
});
