import { getLastSyncTime, getTableData } from "@/data/leaderboard/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

export const GET = withApi(async () => {
  const [table, lastSync] = await Promise.all([getTableData(), getLastSyncTime()]);

  return apiSuccess(table.allTime, {
    count: table.allTime.length,
    lastSyncedAt: lastSync ? lastSync.toISOString() : null,
  });
});

export const OPTIONS = () => handleOptions();
