import z from "zod";
import { getLastSyncTime, getTableDataByMonth } from "@/data/leaderboard/get";
import { apiError, apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

const ParamsSchema = z.object({
  year: z.coerce.number().int().min(2026).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

type Ctx = { params: Promise<{ year: string; month: string }> };

export const GET = withApi<Ctx>(async (_req, ctx) => {
  const raw = await ctx.params;
  const parsed = ParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(400, "invalid_params", "`year` must be 2026-2100 and `month` must be 1-12.");
  }

  const monthKey = `${parsed.data.year}-${String(parsed.data.month).padStart(2, "0")}`;
  const [entries, lastSync] = await Promise.all([getTableDataByMonth(monthKey), getLastSyncTime()]);

  if (!entries || entries.length === 0) {
    return apiError(404, "not_found", `No leaderboard data for ${monthKey}.`);
  }

  return apiSuccess(entries, {
    month: monthKey,
    count: entries.length,
    lastSyncedAt: lastSync?.toISOString() ?? null,
  });
});

export { handleOptions as OPTIONS };
