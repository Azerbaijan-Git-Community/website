import { cacheTag } from "next/cache";
import { describe, expect, test } from "vitest";
import { getGithubStats } from "@/data/stats/get";
import { createAllTimeStats, createUser } from "@test/db";

describe("getGithubStats", () => {
  test("returns zeros when nothing has synced", async () => {
    await expect(getGithubStats()).resolves.toEqual({
      totalCommits: 0,
      totalPullRequests: 0,
      totalContributions: 0,
      totalUsers: 0,
    });
  });

  test("sums all-time stats of non-banned users only", async () => {
    const a = await createUser();
    const b = await createUser();
    const banned = await createUser({ banned: true });
    await createAllTimeStats(a.id, { commits: 10, pullRequests: 2 });
    await createAllTimeStats(b.id, { commits: 5, pullRequests: 1 });
    await createAllTimeStats(banned.id, { commits: 1000, pullRequests: 100 });

    await expect(getGithubStats()).resolves.toMatchObject({ totalCommits: 15, totalPullRequests: 3, totalUsers: 2 });
  });

  test("counts only users that have synced stats", async () => {
    await createUser();
    const synced = await createUser();
    await createAllTimeStats(synced.id, { commits: 1 });

    await expect(getGithubStats()).resolves.toMatchObject({ totalUsers: 1 });
  });

  test("is invalidated together with the leaderboard", async () => {
    await getGithubStats();
    expect(cacheTag).toHaveBeenCalledWith("leaderboard");
  });
});
