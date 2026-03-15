import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const BATCH_SIZE = 50;

const USER_FRAGMENT = `
  contributionsCollection {
    totalCommitContributions
    totalPullRequestContributions
  }
  repositories { totalCount }
  followers { totalCount }
`;

async function fetchBatch(users: { id: string; githubUsername: string }[]) {
  const aliases = users.map((u, i) => `u${i}: user(login: "${u.githubUsername}") { ${USER_FRAGMENT} }`).join("\n");

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GH_STATS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: `query { ${aliases} }` }),
  });

  const json = await res.json();
  return json?.data ?? {};
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = (await prisma.user.findMany({
    where: { githubUsername: { not: null } },
    select: { id: true, githubUsername: true },
  })) as { id: string; githubUsername: string }[];

  let synced = 0;
  let failed = 0;

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    try {
      const data = await fetchBatch(batch);

      await Promise.allSettled(
        batch.map(async ({ id }, index) => {
          const userData = data[`u${index}`];
          if (!userData) {
            failed++;
            return;
          }

          const contrib = userData.contributionsCollection;

          await prisma.githubStats.upsert({
            where: { userId: id },
            create: {
              userId: id,
              commits: contrib.totalCommitContributions,
              pullRequests: contrib.totalPullRequestContributions,
              repositories: userData.repositories.totalCount,
              followers: userData.followers.totalCount,
              contributions: contrib.totalCommitContributions + contrib.totalPullRequestContributions,
            },
            update: {
              commits: contrib.totalCommitContributions,
              pullRequests: contrib.totalPullRequestContributions,
              repositories: userData.repositories.totalCount,
              followers: userData.followers.totalCount,
              contributions: contrib.totalCommitContributions + contrib.totalPullRequestContributions,
            },
          });

          synced++;
        }),
      );
    } catch {
      failed += batch.length;
    }
  }

  revalidateTag("github-stats", { expire: 0 });

  return NextResponse.json({ synced, failed, total: users.length });
}
