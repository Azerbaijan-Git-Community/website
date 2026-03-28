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

function getCurrentWeekKey(): string {
  const date = new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getCurrentMonthKey(): string {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// weekly and allTime only — monthly is handled by getMonthlyLeaderboard
export async function getLeaderboard(period: "weekly" | "allTime"): Promise<LeaderboardEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("leaderboard");

  if (period === "allTime") {
    const stats = await prisma.githubStats.findMany({
      include: { user: { select: { githubUsername: true, name: true, image: true, createdAt: true } } },
      orderBy: { commits: "desc" },
      take: 100,
    });

    return stats
      .filter((s) => s.user.githubUsername)
      .map((s) => ({
        userId: s.userId,
        username: s.user.githubUsername!,
        name: s.user.name,
        image: s.user.image,
        commits: s.commits,
        pullRequests: s.pullRequests,
        joinedAt: s.user.createdAt,
      }));
  }

  // weekly
  const snapshots = await prisma.githubStatsSnapshot.findMany({
    where: { period: "WEEKLY", periodKey: getCurrentWeekKey() },
    include: { user: { select: { githubUsername: true, name: true, image: true, createdAt: true } } },
    orderBy: { commits: "desc" },
    take: 100,
  });

  return snapshots
    .filter((s) => s.user.githubUsername)
    .map((s) => ({
      userId: s.userId,
      username: s.user.githubUsername!,
      name: s.user.name,
      image: s.user.image,
      commits: s.commits,
      pullRequests: s.pullRequests,
      joinedAt: s.user.createdAt,
    }));
}

export async function getAvailableMonths(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("leaderboard");

  const currentKey = getCurrentMonthKey();

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

export async function getMonthlyLeaderboard(monthKey: string): Promise<LeaderboardEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("leaderboard");

  const snapshots = await prisma.githubStatsSnapshot.findMany({
    where: { period: "MONTHLY", periodKey: monthKey },
    include: { user: { select: { githubUsername: true, name: true, image: true, createdAt: true } } },
    orderBy: { commits: "desc" },
    take: 100,
  });

  return snapshots
    .filter((s) => s.user.githubUsername)
    .map((s) => ({
      userId: s.userId,
      username: s.user.githubUsername!,
      name: s.user.name,
      image: s.user.image,
      commits: s.commits,
      pullRequests: s.pullRequests,
      joinedAt: s.user.createdAt,
    }));
}
