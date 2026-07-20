import { getLastSyncTime, getTableData } from "@/data/leaderboard/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import { getMonthKey } from "@/lib/utils.server";

export const GET = withApi(async () => {
  const [table, lastSync] = await Promise.all([getTableData(), getLastSyncTime()]);
  const month = getMonthKey();
  const entries = table.monthly[month] ?? [];

  return apiSuccess(entries, {
    month,
    count: entries.length,
    lastSyncedAt: lastSync?.toISOString() ?? null,
  });
});

export { handleOptions as OPTIONS };
