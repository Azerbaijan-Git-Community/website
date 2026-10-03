import { describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/webhooks/leaderboard/route";
import { createUser, testPrisma } from "@test/db";
import { fakeGraphQL } from "@test/github";
import { request } from "@test/request";

function post(authorization?: string) {
  return POST(
    request("/api/webhooks/leaderboard", { method: "POST", headers: authorization ? { authorization } : {} }),
  );
}

const counts = {
  totalCommitContributions: 4,
  totalPullRequestContributions: 1,
  totalIssueContributions: 0,
  totalPullRequestReviewContributions: 0,
};

function fakeUsers(known: string[]) {
  return fakeGraphQL({
    field: "user",
    resolve: ({ login }) =>
      known.includes(login)
        ? {
            weekly: counts,
            monthly: counts,
            allTime: { ...counts, contributionCalendar: { totalContributions: 9 } },
            repositories: { totalCount: 1 },
            followers: { totalCount: 1 },
          }
        : null,
  });
}

describe("POST /api/webhooks/leaderboard", () => {
  test("rejects callers without the cron secret", async () => {
    const { queries } = fakeUsers([]);
    const res = await post("Bearer test-blog-secret");
    expect(res.status).toBe(401);
    expect(queries).toHaveLength(0);
  });

  test("syncs stats and reports a clean run", async () => {
    await createUser({ githubUsername: "aysel" });
    fakeUsers(["aysel"]);

    const res = await post("Bearer test-cron-secret");

    await expect(res.json()).resolves.toEqual({
      ok: true,
      synced: 1,
      failed: 0,
      total: 1,
      failedUsers: [],
      message: "Synced 1/1 users",
    });
    expect(await testPrisma.githubStats.count()).toBe(1);
  });

  test("mentions failures in the summary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await createUser({ githubUsername: "aysel" });
    await createUser({ githubUsername: "deleted-account" });
    fakeUsers(["aysel"]);

    const body = await (await post("Bearer test-cron-secret")).json();

    expect(body).toMatchObject({ failedUsers: ["deleted-account"], message: "Synced 1/2 users, 1 failed" });
  });
});
