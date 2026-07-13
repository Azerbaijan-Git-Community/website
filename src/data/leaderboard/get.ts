import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getWeekKey } from "@/lib/utils.server";
import { type GithubStatsSnapshotGetPayload } from "@/generated/prisma/models";

export type LeaderboardPeriod = "weekly" | "monthly" | "allTime";

export type LeaderboardEntry = GithubStatsSnapshotGetPayload<{
  select: {
    userId: true;
    commits: true;
    pullRequests: true;
    issues: true;
    reviews: true;
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
    issues: true,
    reviews: true,
    user: { select: userSelect },
  } as const;

  const [weeklyRaw, allTimeRaw, monthlyRaw] = await Promise.all([
    prisma.githubStatsSnapshot.findMany({
      where: { period: "WEEKLY", periodKey: getWeekKey(), user: { banned: false } },
      select: entrySelect,
      orderBy: { commits: "desc" },
      take: 100,
    }),
    prisma.githubStats.findMany({
      where: { user: { banned: false } },
      select: entrySelect,
      orderBy: { commits: "desc" },
      take: 100,
    }),
    prisma.githubStatsSnapshot.findMany({
      where: { period: "MONTHLY", user: { banned: false } },
      select: { ...entrySelect, periodKey: true },
      orderBy: { commits: "desc" },
    }),
  ]);

  const weekly = weeklyRaw as unknown as LeaderboardEntry[];
  const allTime = allTimeRaw as unknown as LeaderboardEntry[];

  const monthly: Record<string, LeaderboardEntry[]> = {};
  // `periodKey` is only used to bucket entries; it must not leak into the entry itself
  // (it isn't part of LeaderboardEntry and breaks the API/MCP output schema).
  for (const { periodKey, ...entry } of monthlyRaw) {
    if (!monthly[periodKey]) monthly[periodKey] = [];
    if (monthly[periodKey].length < 100) monthly[periodKey].push(entry as unknown as LeaderboardEntry);
  }

  return { weekly, allTime, monthly };
}

export async function getLastSyncTime(): Promise<Date | null> {
  "use cache";
  cacheLife("weeks");
  cacheTag("leaderboard");

  const latest = await prisma.githubStats.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return latest?.updatedAt ?? null;
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
