import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/webhooks/blog/route";
import { createUser, testPrisma } from "@test/db";
import { fakeBlogRepo } from "@test/github";
import { request } from "@test/request";

function post(authorization?: string) {
  return POST(request("/api/webhooks/blog", { method: "POST", headers: authorization ? { authorization } : {} }));
}

describe("POST /api/webhooks/blog", () => {
  test("rejects callers without the blog webhook secret", async () => {
    const res = await post("Bearer test-cron-secret");
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("syncs the blog repo and summarizes the run", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await createUser({ githubId: 7 });
    fakeBlogRepo({
      good: { sha: "1", mdx: "---\ntitle: Good\ndescription: d\nauthor: 7\n---\nbody" },
      orphan: { sha: "2", mdx: "---\ntitle: Orphan\ndescription: d\nauthor: 8\n---\nbody" },
    });

    const res = await post("Bearer test-blog-secret");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      synced: 1,
      skipped: 0,
      failed: ["orphan"],
      message: "Synced 1, skipped 0, failed 1",
    });
    expect(await testPrisma.blogPost.count()).toBe(1);
    expect(revalidateTag).toHaveBeenCalledWith("blog", "max");
  });
});
