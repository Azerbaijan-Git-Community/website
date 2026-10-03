import { HttpResponse } from "msw";
import { revalidateTag } from "next/cache";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { syncLeaderboard } from "@/lib/sync/sync-leaderboard";
import { createUser, testPrisma } from "@test/db";
import { fakeGraphQL, type GraphQLReply } from "@test/github";

type Counts = { commits: number; prs: number; issues: number; reviews: number };

function collection({ commits, prs, issues, reviews }: Counts) {
  return {
    totalCommitContributions: commits,
    totalPullRequestContributions: prs,
    totalIssueContributions: issues,
    totalPullRequestReviewContributions: reviews,
  };
}

function githubUser(base: number) {
  return {
    weekly: collection({ commits: base, prs: 1, issues: 0, reviews: 2 }),
    monthly: collection({ commits: base * 4, prs: 3, issues: 1, reviews: 5 }),
    allTime: collection({ commits: base * 50, prs: 40, issues: 10, reviews: 60 }),
    repositories: { totalCount: 12 },
    followers: { totalCount: 7 },
  };
}

/** Fake GitHub that knows `logins` and returns stats derived from each login's position. */
function fakeGithubUsers(logins: string[], intercept?: (i: number) => GraphQLReply) {
  return fakeGraphQL({
    field: "user",
    resolve: ({ login }) => (logins.includes(login) ? githubUser(logins.indexOf(login) + 1) : null),
    intercept,
  });
}

beforeEach(() => {
  // Wednesday 15 July 2026 -> ISO week 2026-W29 (Mon 13th - Mon 20th), month 2026-07.
  vi.useFakeTimers({ now: new Date("2026-07-15T12:00:00Z"), toFake: ["Date"] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("syncLeaderboard", () => {
  test("stores all-time stats plus weekly and monthly snapshots for each user", async () => {
    const user = await createUser({ githubUsername: "aysel" });
    fakeGithubUsers(["aysel"]);

    await expect(syncLeaderboard()).resolves.toEqual({ synced: 1, failed: 0, total: 1, failedUsers: [] });

    expect(await testPrisma.githubStats.findUniqueOrThrow({ where: { userId: user.id } })).toMatchObject({
      commits: 50,
      pullRequests: 40,
      issues: 10,
      reviews: 60,
      repositories: 12,
      followers: 7,
    });
    const snapshots = await testPrisma.githubStatsSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { period: "asc" },
      select: { period: true, periodKey: true, commits: true, pullRequests: true, issues: true, reviews: true },
    });
    expect(snapshots).toEqual([
      { period: "WEEKLY", periodKey: "2026-W29", commits: 1, pullRequests: 1, issues: 0, reviews: 2 },
      { period: "MONTHLY", periodKey: "2026-07", commits: 4, pullRequests: 3, issues: 1, reviews: 5 },
    ]);
  });

  test("queries the current UTC week (Monday to Monday) and month", async () => {
    await createUser({ githubUsername: "aysel" });
    const { queries } = fakeGithubUsers(["aysel"]);

    await syncLeaderboard();

    expect(queries[0]).toContain(
      'weekly: contributionsCollection(from: "2026-07-13T00:00:00.000Z", to: "2026-07-20T00:00:00.000Z")',
    );
    expect(queries[0]).toContain(
      'monthly: contributionsCollection(from: "2026-07-01T00:00:00.000Z", to: "2026-08-01T00:00:00.000Z")',
    );
    expect(queries[0]).toContain("allTime: contributionsCollection {");
  });

  test("handles a Sunday as the last day of the ISO week", async () => {
    vi.setSystemTime(new Date("2026-07-19T23:30:00Z"));
    await createUser({ githubUsername: "aysel" });
    const { queries } = fakeGithubUsers(["aysel"]);

    await syncLeaderboard();

    expect(queries[0]).toContain('from: "2026-07-13T00:00:00.000Z", to: "2026-07-20T00:00:00.000Z"');
    expect(await testPrisma.githubStatsSnapshot.findFirst({ where: { period: "WEEKLY" } })).toMatchObject({
      periodKey: "2026-W29",
    });
  });

  test("updates existing rows on the next run instead of duplicating them", async () => {
    const user = await createUser({ githubUsername: "aysel" });
    fakeGithubUsers(["aysel"]);
    await syncLeaderboard();

    fakeGraphQL({ field: "user", resolve: () => githubUser(10) });
    await syncLeaderboard();

    expect(await testPrisma.githubStats.count()).toBe(1);
    expect(await testPrisma.githubStatsSnapshot.count()).toBe(2);
    expect((await testPrisma.githubStats.findUniqueOrThrow({ where: { userId: user.id } })).commits).toBe(500);
  });

  test("starts a new weekly snapshot when the week rolls over, keeping the old one", async () => {
    await createUser({ githubUsername: "aysel" });
    fakeGithubUsers(["aysel"]);
    await syncLeaderboard();

    vi.setSystemTime(new Date("2026-07-20T01:00:00Z"));
    await syncLeaderboard();

    const weeks = await testPrisma.githubStatsSnapshot.findMany({
      where: { period: "WEEKLY" },
      select: { periodKey: true },
      orderBy: { periodKey: "asc" },
    });
    expect(weeks).toEqual([{ periodKey: "2026-W29" }, { periodKey: "2026-W30" }]);
  });

  test("skips banned users entirely", async () => {
    await createUser({ githubUsername: "human" });
    await createUser({ githubUsername: "bot", banned: true });
    const { queries, aliasesIn } = fakeGithubUsers(["human", "bot"]);

    await expect(syncLeaderboard()).resolves.toMatchObject({ synced: 1, total: 1 });
    expect(aliasesIn(queries[0]).map((a) => a.args.login)).toEqual(["human"]);
  });

  test("records users GitHub can't resolve as failed and keeps syncing the rest", async () => {
    await createUser({ githubUsername: "present" });
    await createUser({ githubUsername: "renamed" });
    fakeGithubUsers(["present"]);

    const result = await syncLeaderboard();

    expect(result).toEqual({ synced: 1, failed: 1, total: 2, failedUsers: ["renamed"] });
    expect(await testPrisma.githubStats.count()).toBe(1);
  });

  test("treats a payload missing a contributions window as failed", async () => {
    await createUser({ githubUsername: "partial" });
    fakeGraphQL({ field: "user", resolve: () => ({ ...githubUser(1), monthly: null }) });

    await expect(syncLeaderboard()).resolves.toMatchObject({ synced: 0, failedUsers: ["partial"] });
    expect(await testPrisma.githubStats.count()).toBe(0);
  });

  test("queries users in batches of five", async () => {
    const logins = Array.from({ length: 12 }, (_, i) => `dev${i}`);
    for (const githubUsername of logins) await createUser({ githubUsername });
    const { queries, aliasesIn } = fakeGithubUsers(logins);

    await expect(syncLeaderboard()).resolves.toMatchObject({ synced: 12, failed: 0, total: 12 });

    expect(queries.map((q) => aliasesIn(q).length)).toEqual([5, 5, 2]);
    const queried = queries.flatMap((q) => aliasesIn(q).map((a) => a.args.login));
    expect(queried.toSorted()).toEqual(logins.toSorted());
  });

  test("retries a batch after a secondary rate limit, honoring retry-after", async () => {
    await createUser({ githubUsername: "aysel" });
    const { queries } = fakeGithubUsers(["aysel"], (i) =>
      i === 0 ? new HttpResponse("secondary rate limit", { status: 403, headers: { "retry-after": "0" } }) : undefined,
    );

    await expect(syncLeaderboard()).resolves.toMatchObject({ synced: 1, failed: 0 });
    expect(queries).toHaveLength(2);
  });

  test("gives up on a batch after three rate-limited attempts", async () => {
    await createUser({ githubUsername: "a" });
    await createUser({ githubUsername: "b" });
    const { queries } = fakeGithubUsers(
      ["a", "b"],
      () => new HttpResponse("secondary rate limit", { status: 429, headers: { "retry-after": "0" } }),
    );

    const result = await syncLeaderboard();

    expect(queries).toHaveLength(3);
    expect(result).toMatchObject({ synced: 0, failed: 2, total: 2 });
    expect(result.failedUsers.toSorted()).toEqual(["a", "b"]);
  });

  test("does not retry other transport errors", async () => {
    await createUser({ githubUsername: "aysel" });
    const { queries } = fakeGithubUsers(["aysel"], () => new HttpResponse("Bad credentials", { status: 401 }));

    await expect(syncLeaderboard()).resolves.toMatchObject({ synced: 0, failedUsers: ["aysel"] });
    expect(queries).toHaveLength(1);
  });

  test("pauses for a minute after every 12 batches to respect GitHub's secondary limit", async () => {
    const logins = Array.from({ length: 61 }, (_, i) => `dev${i}`);
    await testPrisma.user.createMany({
      data: logins.map((githubUsername, i) => ({
        name: githubUsername,
        email: `${githubUsername}@example.com`,
        githubUsername,
        githubId: 10_000 + i,
        image: "https://example.com/a.png",
        role: "user",
      })),
    });
    fakeGithubUsers(logins);
    const realSetTimeout = globalThis.setTimeout;
    const pauses: number[] = [];
    // Skip the real one-minute cool-down but record that it was requested.
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn, ms) => {
      if (ms === 60_000) pauses.push(ms);
      return realSetTimeout(fn, ms === 60_000 ? 0 : ms);
    });

    await expect(syncLeaderboard()).resolves.toMatchObject({ synced: 61, total: 61 });
    // 61 users -> 13 batches -> one cool-down before the 13th batch.
    expect(pauses).toEqual([60_000]);
  });

  test("revalidates the leaderboard cache even when some users fail", async () => {
    await createUser({ githubUsername: "ghost" });
    fakeGithubUsers([]);

    await syncLeaderboard();

    expect(revalidateTag).toHaveBeenCalledWith("leaderboard", "max");
  });

  test("does nothing but revalidate when there are no users", async () => {
    const { queries } = fakeGithubUsers([]);

    await expect(syncLeaderboard()).resolves.toEqual({ synced: 0, failed: 0, total: 0, failedUsers: [] });
    expect(queries).toHaveLength(0);
    expect(revalidateTag).toHaveBeenCalledWith("leaderboard", "max");
  });

  // The week key comes from local-time getWeekKey() while the queried range is UTC, so in UTC+4 on a
  // Sunday evening last week's numbers are filed under next week's key.
  test.fails("BUG-01: files weekly stats under the same week that was queried, in any server timezone", async () => {
    vi.stubEnv("TZ", "Asia/Baku");
    vi.setSystemTime(new Date("2026-07-19T22:00:00Z"));
    await createUser({ githubUsername: "aysel" });
    fakeGithubUsers(["aysel"]);

    await syncLeaderboard();

    expect(await testPrisma.githubStatsSnapshot.findFirst({ where: { period: "WEEKLY" } })).toMatchObject({
      periodKey: "2026-W29",
    });
  });

  // `GithubStats.contributions` is summed into `totalContributions` by getGithubStats, but no code ever writes it.
  test.fails("BUG-09: populates the all-time contributions column", async () => {
    const user = await createUser({ githubUsername: "aysel" });
    fakeGithubUsers(["aysel"]);

    await syncLeaderboard();

    const stats = await testPrisma.githubStats.findUniqueOrThrow({ where: { userId: user.id } });
    expect(stats.contributions).toBeGreaterThan(0);
  });
});
