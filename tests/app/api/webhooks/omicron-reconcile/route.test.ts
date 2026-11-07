import { describe, expect, test } from "vitest";
import { POST } from "@/app/api/webhooks/omicron-reconcile/route";
import { createOmicronConnection, createUser, testPrisma } from "@test/db";
import { fakeOmicronListing, omicronPost } from "@test/omicron";
import { request } from "@test/request";

const post = (authorization?: string) =>
  POST(request("/api/webhooks/omicron-reconcile", { method: "POST", headers: authorization ? { authorization } : {} }));

describe("POST /api/webhooks/omicron-reconcile", () => {
  test("rejects callers without the cron secret", async () => {
    expect((await post()).status).toBe(401);
    expect((await post("Bearer nope")).status).toBe(401);
  });

  test("reconciles every connected account and summarizes the run", async () => {
    const user = await createUser();
    await createOmicronConnection(user.id, { username: "ada" });
    fakeOmicronListing("ada", [[omicronPost()]]);

    const res = await post("Bearer test-cron-secret");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      synced: 1,
      failed: [],
      message: "Reconciled 1 accounts, failed 0",
    });
    expect(await testPrisma.blogPost.count()).toBe(1);
  });
});
