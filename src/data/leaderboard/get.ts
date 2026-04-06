"use server";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export type LeaderboardPeriod = "weekly" | "monthly" | "allTime";

export type LeaderboardEntry = {
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
  commits: number;
  pullRequests: number;
  joinedAt: Date;
};

export type AllTableData = {
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  monthly: Record<string, LeaderboardEntry[]>;
};

function getCurrentWeekKey(): string {
  const date = new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function getCurrentMonthKey(): Promise<string> {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mapEntry(s: {
  userId: string;
  commits: number;
  pullRequests: number;
  user: { githubUsername: string | null; name: string | null; image: string | null; createdAt: Date };
}): LeaderboardEntry | null {
  if (!s.user.githubUsername) return null;
  return {
    userId: s.userId,
    username: s.user.githubUsername,
    name: s.user.name,
    image: s.user.image,
    commits: s.commits,
    pullRequests: s.pullRequests,
    joinedAt: s.user.createdAt,
  };
}

export async function getAvailableMonths(): Promise<string[]> {
  "use cache";
  cacheLife("weeks");
  cacheTag("leaderboard");

  const currentKey = await getCurrentMonthKey();

  const keys = await prisma.githubStatsSnapshot.findMany({
    where: { period: "MONTHLY" },
    select: { periodKey: true },
    distinct: ["periodKey"],
    orderBy: { periodKey: "desc" },
  });

  const existing = keys.map((k) => k.periodKey);
  if (!existing.includes(currentKey)) existing.unshift(currentKey);

  return existing;
}

export async function getTableData(): Promise<AllTableData> {
  "use cache";
  cacheLife("weeks");
  cacheTag("leaderboard");

  const userSelect = { githubUsername: true, name: true, image: true, createdAt: true } as const;

  const [weeklyRaw, allTimeRaw, monthlyRaw] = await Promise.all([
    prisma.githubStatsSnapshot.findMany({
      where: { period: "WEEKLY", periodKey: getCurrentWeekKey() },
      include: { user: { select: userSelect } },
      orderBy: { commits: "desc" },
      take: 100,
    }),
    prisma.githubStats.findMany({
      include: { user: { select: userSelect } },
      orderBy: { commits: "desc" },
      take: 100,
    }),
    prisma.githubStatsSnapshot.findMany({
      where: { period: "MONTHLY" },
      include: { user: { select: userSelect } },
      orderBy: { commits: "desc" },
    }),
  ]);

  const weekly = weeklyRaw.map(mapEntry).filter((e): e is LeaderboardEntry => e !== null);
  const allTime = allTimeRaw.map(mapEntry).filter((e): e is LeaderboardEntry => e !== null);

  const monthly: Record<string, LeaderboardEntry[]> = {};
  for (const s of monthlyRaw) {
    const entry = mapEntry(s);
    if (!entry) continue;
    if (!monthly[s.periodKey]) monthly[s.periodKey] = [];
    if (monthly[s.periodKey].length < 100) monthly[s.periodKey].push(entry);
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
