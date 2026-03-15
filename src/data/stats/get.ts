"use server";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getGithubStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("github-stats");

  const result = await prisma.githubStats.aggregate({
    _sum: { commits: true, pullRequests: true, contributions: true },
    _count: { userId: true },
  });

  return {
    totalCommits: result._sum.commits ?? 0,
    totalPullRequests: result._sum.pullRequests ?? 0,
    totalContributions: result._sum.contributions ?? 0,
    totalUsers: result._count.userId,
  };
}
