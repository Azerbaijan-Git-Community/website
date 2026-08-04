import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import type { GithubStatsSnapshotGetPayload } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import { getMonthKey, getWeekKey } from "@/lib/utils.server";

export type LeaderboardPeriod = "weekly" | "monthly" | "allTime";

export type LeaderboardEntry = GithubStatsSnapshotGetPayload<{ select: typeof entrySelect }>;

export type AllTableData = {
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
};

const userSelect = { githubUsername: true, name: true, image: true } satisfies Prisma.UserSelect;
const entrySelect = {
  userId: true,
  commits: true,
  pullRequests: true,
  issues: true,
  reviews: true,

  user: { select: userSelect },
} satisfies Prisma.GithubStatsSnapshotSelect;

export async function getTableData(): Promise<AllTableData> {
  "use cache";
  cacheLife("max");
  cacheTag("leaderboard");

  const [weekly, monthly, allTime] = await Promise.all([
    prisma.githubStatsSnapshot.findMany({
      where: { period: "WEEKLY", periodKey: getWeekKey(), user: { banned: false } },
      select: entrySelect,
      orderBy: { commits: "desc" },
      take: 50,
    }),
    getTableDataByMonth(getMonthKey()),
    prisma.githubStats.findMany({
      where: { user: { banned: false } },
      select: entrySelect,
      orderBy: { commits: "desc" },
      take: 50,
    }),
  ]);

  return { weekly, allTime, monthly };
}

/** Top 50 contributors for a specific month (`YYYY-MM`), ranked by commits. */
export async function getTableDataByMonth(monthKey: string): Promise<LeaderboardEntry[]> {
  "use cache";
  cacheLife("max");
  cacheTag("leaderboard");

  return prisma.githubStatsSnapshot.findMany({
    where: { period: "MONTHLY", periodKey: monthKey, user: { banned: false } },
    select: entrySelect,
    orderBy: { commits: "desc" },
    take: 50,
  });
}

export async function getLastSyncTime(): Promise<Date | null> {
  "use cache";
  cacheLife("max");
  cacheTag("leaderboard");

  const latest = await prisma.githubStats.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return latest?.updatedAt ?? null;
}

export async function getPodiumData(): Promise<Record<string, LeaderboardEntry[]>> {
  "use cache";
  cacheLife("max");
  cacheTag("leaderboard");

  const monthKeys = (
    await prisma.githubStatsSnapshot.findMany({
      where: { period: "MONTHLY", user: { banned: false } },
      select: { periodKey: true },
      distinct: ["periodKey"],
    })
  ).map((row) => row.periodKey);

  const perMonth = await Promise.all(
    monthKeys.map((periodKey) =>
      prisma.githubStatsSnapshot.findMany({
        where: { period: "MONTHLY", periodKey, user: { banned: false } },
        select: entrySelect,
        orderBy: { commits: "desc" },
        take: 3,
      }),
    ),
  );

  const podium: Record<string, LeaderboardEntry[]> = {};
  monthKeys.forEach((periodKey, i) => {
    podium[periodKey] = perMonth[i];
  });
  return podium;
}
