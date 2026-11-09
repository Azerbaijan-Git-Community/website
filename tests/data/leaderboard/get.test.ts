import { cacheTag } from "next/cache";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getLastSyncTime,
  getPodiumData,
  getTableData,
  getTableDataByMonth,
  getUserRanks,
} from "@/data/leaderboard/get";
import { createAllTimeStats, createSnapshot, createUser } from "@test/db";

beforeEach(() => {
  // 2026-07-15 -> week 2026-W29, month 2026-07
  vi.useFakeTimers({ now: new Date("2026-07-15T12:00:00Z"), toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getTableDataByMonth", () => {
  test("ranks the month's contributors by commits with public user fields", async () => {
    const a = await createUser({ githubUsername: "a" });
    const b = await createUser({ githubUsername: "b" });
    await createSnapshot(a.id, "MONTHLY", "2026-06", { commits: 5, pullRequests: 1, issues: 2, reviews: 3 });
    await createSnapshot(b.id, "MONTHLY", "2026-06", { commits: 9 });

    const entries = await getTableDataByMonth("2026-06");

    expect(entries).toEqual([
      {
        userId: b.id,
        commits: 9,
        pullRequests: 0,
        issues: 0,
        reviews: 0,
        user: { githubUsername: "b", name: b.name, image: b.image },
      },
      {
        userId: a.id,
        commits: 5,
        pullRequests: 1,
        issues: 2,
        reviews: 3,
        user: { githubUsername: "a", name: a.name, image: a.image },
      },
    ]);
  });

  test("only includes that month's monthly snapshots", async () => {
    const user = await createUser();
    await createSnapshot(user.id, "MONTHLY", "2026-05", { commits: 1 });
    await createSnapshot(user.id, "WEEKLY", "2026-06", { commits: 2 });

    await expect(getTableDataByMonth("2026-06")).resolves.toEqual([]);
  });

  test("excludes banned users", async () => {
    const banned = await createUser({ banned: true });
    await createSnapshot(banned.id, "MONTHLY", "2026-06", { commits: 100 });

    await expect(getTableDataByMonth("2026-06")).resolves.toEqual([]);
  });

  test("returns at most the top 50", async () => {
    for (let i = 0; i < 52; i++) {
      const user = await createUser();
      await createSnapshot(user.id, "MONTHLY", "2026-06", { commits: i });
    }

    const entries = await getTableDataByMonth("2026-06");

    expect(entries).toHaveLength(50);
    expect(entries[0].commits).toBe(51);
    expect(entries.at(-1)?.commits).toBe(2);
  });
});

describe("getTableData", () => {
  test("returns the current week, current month and all-time tables", async () => {
    const user = await createUser({ githubUsername: "aysel" });
    await createSnapshot(user.id, "WEEKLY", "2026-W29", { commits: 3 });
    await createSnapshot(user.id, "WEEKLY", "2026-W28", { commits: 99 });
    await createSnapshot(user.id, "MONTHLY", "2026-07", { commits: 12 });
    await createSnapshot(user.id, "MONTHLY", "2026-06", { commits: 99 });
    await createAllTimeStats(user.id, { commits: 400 });

    const table = await getTableData();

    expect(table.weekly.map((e) => e.commits)).toEqual([3]);
    expect(table.monthly.map((e) => e.commits)).toEqual([12]);
    expect(table.allTime.map((e) => e.commits)).toEqual([400]);
    expect(table.allTime[0].user.githubUsername).toBe("aysel");
  });

  test("ranks and filters every table", async () => {
    const top = await createUser({ githubUsername: "top" });
    const second = await createUser({ githubUsername: "second" });
    const banned = await createUser({ githubUsername: "banned", banned: true });
    for (const [user, commits] of [
      [top, 10],
      [second, 5],
      [banned, 1000],
    ] as const) {
      await createSnapshot(user.id, "WEEKLY", "2026-W29", { commits });
      await createSnapshot(user.id, "MONTHLY", "2026-07", { commits });
      await createAllTimeStats(user.id, { commits });
    }

    const table = await getTableData();

    for (const period of ["weekly", "monthly", "allTime"] as const) {
      expect(table[period].map((e) => e.user.githubUsername)).toEqual(["top", "second"]);
    }
  });

  test("returns empty tables when nothing has synced", async () => {
    await expect(getTableData()).resolves.toEqual({ weekly: [], monthly: [], allTime: [] });
  });

  test("is cached under the leaderboard tag", async () => {
    await getTableData();
    expect(cacheTag).toHaveBeenCalledWith("leaderboard");
  });
});

describe("getLastSyncTime", () => {
  test("returns the most recent all-time stats update", async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createUser();
    await createAllTimeStats(a.id, { updatedAt: new Date("2026-07-15T09:00:00Z") });
    await createAllTimeStats(b.id, { updatedAt: new Date("2026-07-15T11:00:00Z") });
    await createAllTimeStats(c.id, { updatedAt: new Date("2026-07-15T10:00:00Z") });

    await expect(getLastSyncTime()).resolves.toEqual(new Date("2026-07-15T11:00:00Z"));
  });

  test("returns null before the first sync", async () => {
    await expect(getLastSyncTime()).resolves.toBeNull();
  });
});

describe("getPodiumData", () => {
  test("returns the top three per month, keyed by month", async () => {
    const users = await Promise.all([1, 2, 3, 4].map((i) => createUser({ githubUsername: `u${i}` })));
    for (const [i, user] of users.entries()) {
      await createSnapshot(user.id, "MONTHLY", "2026-06", { commits: (i + 1) * 10 });
    }
    await createSnapshot(users[0].id, "MONTHLY", "2026-07", { commits: 1 });

    const podium = await getPodiumData();

    expect(Object.keys(podium).toSorted()).toEqual(["2026-06", "2026-07"]);
    expect(podium["2026-06"].map((e) => e.user.githubUsername)).toEqual(["u4", "u3", "u2"]);
    expect(podium["2026-07"].map((e) => e.commits)).toEqual([1]);
  });

  test("ignores weekly snapshots and banned users", async () => {
    const banned = await createUser({ banned: true });
    const user = await createUser();
    await createSnapshot(banned.id, "MONTHLY", "2026-05", { commits: 100 });
    await createSnapshot(user.id, "WEEKLY", "2026-W20", { commits: 5 });

    await expect(getPodiumData()).resolves.toEqual({});
  });
});

describe("getUserRanks", () => {
  test("ranks a member by commits on each board", async () => {
    const me = await createUser({ githubUsername: "me" });
    const ahead = await createUser({ githubUsername: "ahead" });
    await createSnapshot(me.id, "WEEKLY", "2026-W29", { commits: 5 });
    await createSnapshot(ahead.id, "WEEKLY", "2026-W29", { commits: 9 });
    await createSnapshot(me.id, "MONTHLY", "2026-07", { commits: 30 });
    await createSnapshot(ahead.id, "MONTHLY", "2026-07", { commits: 20 });
    await createAllTimeStats(me.id, { commits: 400 });

    await expect(getUserRanks(me.id)).resolves.toEqual({
      weekly: { rank: 2, commits: 5 },
      monthly: { rank: 1, commits: 30 },
      allTime: { rank: 1, commits: 400 },
    });
  });

  test("ignores banned members and other periods", async () => {
    const me = await createUser({ githubUsername: "me" });
    const banned = await createUser({ githubUsername: "banned", banned: true });
    await createSnapshot(me.id, "WEEKLY", "2026-W29", { commits: 5 });
    await createSnapshot(banned.id, "WEEKLY", "2026-W29", { commits: 50 });
    await createSnapshot(banned.id, "WEEKLY", "2026-W28", { commits: 50 });

    expect((await getUserRanks(me.id)).weekly).toEqual({ rank: 1, commits: 5 });
  });

  test("leaves members without commits or outside the top 50 unranked", async () => {
    const me = await createUser({ githubUsername: "me" });
    await createSnapshot(me.id, "WEEKLY", "2026-W29", { commits: 0 });
    await createAllTimeStats(me.id, { commits: 3 });
    for (let i = 0; i < 50; i++) {
      const other = await createUser({ githubUsername: `other-${i}` });
      await createAllTimeStats(other.id, { commits: 10 + i });
    }

    await expect(getUserRanks(me.id)).resolves.toEqual({
      weekly: { rank: null, commits: 0 },
      monthly: { rank: null, commits: 0 },
      allTime: { rank: null, commits: 3 },
    });
  });
});
