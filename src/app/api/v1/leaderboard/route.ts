import { getLastSyncTime, getTableDataByMonth } from "@/data/leaderboard/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import { getMonthKey } from "@/lib/utils.server";

export const GET = withApi(async () => {
  const month = getMonthKey();
  const [entries, lastSync] = await Promise.all([getTableDataByMonth(month), getLastSyncTime()]);

  return apiSuccess(entries, {
    month,
    count: entries.length,
    lastSyncedAt: lastSync?.toISOString() ?? null,
  });
});

export { handleOptions as OPTIONS };
