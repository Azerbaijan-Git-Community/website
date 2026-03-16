import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const BATCH_SIZE = 50;

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getWeekRange(date: Date): { from: string; to: string } {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  const from = d.toISOString();

  const to = new Date(d);
  to.setUTCDate(to.getUTCDate() + 7);
  return { from, to: to.toISOString() };
}

function getMonthRange(date: Date): { from: string; to: string } {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
  return { from, to };
}

function buildBatchQuery(
  users: { id: string; githubUsername: string }[],
  weekRange: { from: string; to: string },
  monthRange: { from: string; to: string },
) {
  const aliases = users
    .map(
      (u, i) => `
    u${i}: user(login: "${u.githubUsername}") {
      weekly: contributionsCollection(from: "${weekRange.from}", to: "${weekRange.to}") {
        totalCommitContributions
        totalPullRequestContributions
      }
      monthly: contributionsCollection(from: "${monthRange.from}", to: "${monthRange.to}") {
        totalCommitContributions
        totalPullRequestContributions
      }
      allTime: contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
      }
      repositories { totalCount }
      followers { totalCount }
    }
  `,
    )
    .join("\n");

  return `query { ${aliases} }`;
}

async function fetchBatch(
  users: { id: string; githubUsername: string }[],
  weekRange: { from: string; to: string },
  monthRange: { from: string; to: string },
) {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GH_STATS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: buildBatchQuery(users, weekRange, monthRange) }),
  });

  const json = await res.json();
  return json?.data ?? {};
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  const users = (await prisma.user.findMany({
    where: { githubUsername: { not: null } },
    select: { id: true, githubUsername: true },
  })) as { id: string; githubUsername: string }[];

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    try {
      const data = await fetchBatch(batch, weekRange, monthRange);

      await Promise.allSettled(
        batch.map(async ({ id }, index) => {
          const userData = data[`u${index}`];
          if (!userData) {
            failed++;
            return;
          }

          const { weekly, monthly, allTime, repositories, followers } = userData;

          await prisma.$transaction([
            prisma.githubStats.upsert({
              where: { userId: id },
              create: {
                userId: id,
                commits: allTime.totalCommitContributions,
                pullRequests: allTime.totalPullRequestContributions,
                repositories: repositories.totalCount,
                followers: followers.totalCount,
              },
              update: {
                commits: allTime.totalCommitContributions,
                pullRequests: allTime.totalPullRequestContributions,
                repositories: repositories.totalCount,
                followers: followers.totalCount,
              },
            }),
            prisma.githubStatsSnapshot.upsert({
              where: { userId_period_periodKey: { userId: id, period: "WEEKLY", periodKey: weekKey } },
              create: {
                userId: id,
                period: "WEEKLY",
                periodKey: weekKey,
                commits: weekly.totalCommitContributions,
                pullRequests: weekly.totalPullRequestContributions,
              },
              update: {
                commits: weekly.totalCommitContributions,
                pullRequests: weekly.totalPullRequestContributions,
              },
            }),
            prisma.githubStatsSnapshot.upsert({
              where: { userId_period_periodKey: { userId: id, period: "MONTHLY", periodKey: monthKey } },
              create: {
                userId: id,
                period: "MONTHLY",
                periodKey: monthKey,
                commits: monthly.totalCommitContributions,
                pullRequests: monthly.totalPullRequestContributions,
              },
              update: {
                commits: monthly.totalCommitContributions,
                pullRequests: monthly.totalPullRequestContributions,
              },
            }),
          ]);

          synced++;
        }),
      );
    } catch {
      failed += batch.length;
    }
  }

  revalidateTag("github-stats", { expire: 0 });
  revalidateTag("leaderboard", { expire: 0 });

  return NextResponse.json({
    synced,
    failed,
    total: users.length,
    message: `Synced ${synced}/${users.length} users${failed > 0 ? `, ${failed} failed` : ""}`,
  });
}
