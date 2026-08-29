import { revalidateTag } from "next/cache";
import { z } from "zod";
import { cacheTags } from "@/lib/cache-tags";
import { ghGraphQL, GithubRequestError } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { getMonthKey, getWeekKey } from "@/lib/utils.server";

const BATCH_SIZE = 5;

/** Spacing between batches so bursts don't trip GitHub's GraphQL secondary rate limit (403). */
const BATCH_DELAY_MS = 1000;

/** Cool-down assumed when GitHub sends no `retry-after`, and the cap on any single wait. */
const RATE_LIMIT_FALLBACK_MS = 60_000;
const MAX_RATE_LIMIT_WAIT_MS = 120_000;
const MAX_BATCH_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fisher–Yates shuffle so heavy accounts don't cluster into the same batch every run. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Wait (ms) before retrying a secondary-rate-limited request, or `null` for any other error. */
function rateLimitWaitMs(error: unknown): number | null {
  if (error instanceof GithubRequestError && error.secondaryRateLimit) {
    return Math.min(error.retryAfterMs ?? RATE_LIMIT_FALLBACK_MS, MAX_RATE_LIMIT_WAIT_MS);
  }
  return null;
}

const ContributionDataSchema = z.object({
  totalCommitContributions: z.number(),
  totalPullRequestContributions: z.number(),
  totalIssueContributions: z.number(),
  totalPullRequestReviewContributions: z.number(),
});

type ContributionData = z.infer<typeof ContributionDataSchema>;

const UserDataSchema = z.object({
  weekly: ContributionDataSchema,
  monthly: ContributionDataSchema,
  allTime: ContributionDataSchema,
  repositories: z.object({ totalCount: z.number() }),
  followers: z.object({ totalCount: z.number() }),
});

type UserData = z.infer<typeof UserDataSchema>;

type SyncUser = { id: string; githubUsername: string };
type Range = { from: string; to: string };

/** Map a GraphQL contributions collection onto the columns shared by both stats tables. */
function toCounts(c: ContributionData) {
  return {
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    issues: c.totalIssueContributions,
    reviews: c.totalPullRequestReviewContributions,
  };
}

function getWeekRange(date: Date): Range {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  const from = d.toISOString();

  const to = new Date(d);
  to.setUTCDate(to.getUTCDate() + 7);
  return { from, to: to.toISOString() };
}

function getMonthRange(date: Date): Range {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
  return { from, to };
}

const CONTRIBUTION_FIELDS = `
  totalCommitContributions
  totalPullRequestContributions
  totalIssueContributions
  totalPullRequestReviewContributions`;

function buildBatchQuery(users: SyncUser[], weekRange: Range, monthRange: Range): string {
  const aliases = users
    .map(
      (u, i) => `
    u${i}: user(login: "${u.githubUsername}") {
      weekly: contributionsCollection(from: "${weekRange.from}", to: "${weekRange.to}") {${CONTRIBUTION_FIELDS}
      }
      monthly: contributionsCollection(from: "${monthRange.from}", to: "${monthRange.to}") {${CONTRIBUTION_FIELDS}
      }
      allTime: contributionsCollection {${CONTRIBUTION_FIELDS}
      }
      repositories { totalCount }
      followers { totalCount }
    }
  `,
    )
    .join("\n");

  return `query { ${aliases} }`;
}

function isComplete(d: UserData | undefined): d is UserData {
  return Boolean(d?.weekly && d?.monthly && d?.allTime);
}

type FetchBatchOptions = { users: SyncUser[]; weekRange: Range; monthRange: Range };

/**
 * Fetch one batch, retrying the whole batch across a secondary-rate-limit cool-down (the limit
 * throttles the entire token, so retrying before the window elapses just re-hits the 403). Returns
 * whatever completed; the caller records the rest as failed.
 */
async function fetchBatch({ users, weekRange, monthRange }: FetchBatchOptions): Promise<Record<string, UserData>> {
  for (let attempt = 1; attempt <= MAX_BATCH_ATTEMPTS; attempt++) {
    try {
      const json = await ghGraphQL<Record<string, UserData | undefined>>(buildBatchQuery(users, weekRange, monthRange));
      const result: Record<string, UserData> = {};
      for (let i = 0; i < users.length; i++) {
        const d = json.data?.[`u${i}`];
        if (isComplete(d)) result[`u${i}`] = d;
      }
      if (json.errors) console.error(`Batch returned partial errors:`, JSON.stringify(json.errors));
      return result;
    } catch (error) {
      const wait = rateLimitWaitMs(error);
      if (wait === null || attempt === MAX_BATCH_ATTEMPTS) {
        console.error(`Batch request failed:`, error);
        return {};
      }
      console.error(`Batch hit secondary rate limit, waiting ${Math.round(wait / 1000)}s before retry...`);
      await sleep(wait);
    }
  }

  return {};
}

/** Write one user's all-time stats plus their weekly and monthly snapshots. */
function persistUser(userId: string, data: UserData, weekKey: string, monthKey: string) {
  const allTime = {
    ...toCounts(data.allTime),
    repositories: data.repositories.totalCount,
    followers: data.followers.totalCount,
  };
  const weekly = toCounts(data.weekly);
  const monthly = toCounts(data.monthly);

  return prisma.$transaction([
    prisma.githubStats.upsert({
      where: { userId },
      create: { userId, ...allTime },
      update: allTime,
    }),
    prisma.githubStatsSnapshot.upsert({
      where: { userId_period_periodKey: { userId, period: "WEEKLY", periodKey: weekKey } },
      create: { userId, period: "WEEKLY", periodKey: weekKey, ...weekly },
      update: weekly,
    }),
    prisma.githubStatsSnapshot.upsert({
      where: { userId_period_periodKey: { userId, period: "MONTHLY", periodKey: monthKey } },
      create: { userId, period: "MONTHLY", periodKey: monthKey, ...monthly },
      update: monthly,
    }),
  ]);
}

/**
 * Fetch GitHub contribution stats for every non-banned user and upsert them into the
 * all-time table plus the weekly/monthly snapshot tables.
 */
export async function syncLeaderboard(): Promise<{
  synced: number;
  failed: number;
  total: number;
  failedUsers: string[];
}> {
  const now = new Date();
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  const users = shuffle(
    await prisma.user.findMany({ where: { banned: false }, select: { id: true, githubUsername: true } }),
  );

  let synced = 0;
  const failedUsers: string[] = [];

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    // Space batches apart so the burst never trips GitHub's secondary rate limit.
    if (i > 0) await sleep(BATCH_DELAY_MS);

    try {
      const data = await fetchBatch({ users: batch, weekRange, monthRange });

      await Promise.allSettled(
        batch.map(async ({ id, githubUsername }, index) => {
          const userData = data[`u${index}`];
          if (!userData) {
            console.error(`[sync-leaderboard] No data fetched for ${githubUsername}`);
            failedUsers.push(githubUsername);
            return;
          }

          try {
            await persistUser(id, userData, weekKey, monthKey);
            synced++;
          } catch (error) {
            console.error(`[sync-leaderboard] Failed to persist ${githubUsername}:`, error);
            failedUsers.push(githubUsername);
          }
        }),
      );
    } catch (error) {
      console.error(`[sync-leaderboard] Batch failed for [${batch.map((u) => u.githubUsername).join(", ")}]:`, error);
      for (const u of batch) failedUsers.push(u.githubUsername);
    }
  }

  if (failedUsers.length > 0) {
    console.error(`[sync-leaderboard] ${failedUsers.length} user(s) failed to sync: ${failedUsers.join(", ")}`);
  }

  revalidateTag(cacheTags.leaderboard, "max");

  return { synced, failed: failedUsers.length, total: users.length, failedUsers };
}
