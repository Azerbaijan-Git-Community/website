import { webhookRoute } from "@/lib/api/webhook-route";
import { serverEnv } from "@/lib/env.server";
import { syncLeaderboard } from "@/lib/sync/sync-leaderboard";

export const POST = webhookRoute({
  secret: serverEnv.CRON_SECRET,
  run: syncLeaderboard,
  message: (r) => `Synced ${r.synced}/${r.total} users${r.failed > 0 ? `, ${r.failed} failed` : ""}`,
});
