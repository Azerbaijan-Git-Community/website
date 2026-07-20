import { getLastSyncTime } from "@/data/leaderboard/get";
import { getGithubStats } from "@/data/stats/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

export const GET = withApi(async () => {
  const [stats, lastSync] = await Promise.all([getGithubStats(), getLastSyncTime()]);

  return apiSuccess({
    totalCommits: stats.totalCommits,
    totalPullRequests: stats.totalPullRequests,
    totalUsers: stats.totalUsers,
    lastSyncedAt: lastSync?.toISOString() ?? null,
  });
});

export { handleOptions as OPTIONS };
