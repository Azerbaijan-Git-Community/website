"use server";

import { cacheLife, cacheTag } from "next/cache";
import { type GithubStatsSnapshotGetPayload } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import { getWeekKey } from "@/lib/utils.server";

export type LeaderboardPeriod = "weekly" | "monthly" | "allTime";

export type LeaderboardEntry = GithubStatsSnapshotGetPayload<{
  select: {
    userId: true;
    commits: true;
    pullRequests: true;
    user: { select: typeof userSelect };
  };
}>;

export type AllTableData = {
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  monthly: Record<string, LeaderboardEntry[]>;
};

const userSelect = { githubUsername: true, name: true, image: true, createdAt: true } as const;
export async function getTableData(): Promise<AllTableData> {
  "use cache";
  cacheLife("weeks");
  cacheTag("leaderboard");

  const entrySelect = {
    userId: true,
    commits: true,
    pullRequests: true,
    user: { select: userSelect },
  } as const;

  const [weeklyRaw, allTimeRaw, monthlyRaw] = await Promise.all([
    prisma.githubStatsSnapshot.findMany({
      where: { period: "WEEKLY", periodKey: getWeekKey() },
      select: entrySelect,
      orderBy: { commits: "desc" },
      take: 100,
    }),
    prisma.githubStats.findMany({
      select: entrySelect,
      orderBy: { commits: "desc" },
      take: 100,
    }),
    prisma.githubStatsSnapshot.findMany({
      where: { period: "MONTHLY" },
      select: { ...entrySelect, periodKey: true },
      orderBy: { commits: "desc" },
    }),
  ]);

  const weekly = weeklyRaw as unknown as LeaderboardEntry[];
  const allTime = allTimeRaw as unknown as LeaderboardEntry[];

  const monthly: Record<string, LeaderboardEntry[]> = {};
  for (const s of monthlyRaw) {
    if (!monthly[s.periodKey]) monthly[s.periodKey] = [];
    if (monthly[s.periodKey].length < 100) monthly[s.periodKey].push(s as unknown as LeaderboardEntry);
  }

  return { weekly, allTime, monthly };
}

export async function getPodiumData(): Promise<Record<string, LeaderboardEntry[]>> {
  "use cache";
  cacheLife("weeks");
  cacheTag("leaderboard");

  const { monthly } = await getTableData();
  const podium: Record<string, LeaderboardEntry[]> = {};
  for (const [key, entries] of Object.entries(monthly)) {
    podium[key] = entries.slice(0, 3);
  }
  return podium;
}
