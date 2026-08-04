import { webhookRoute } from "@/lib/api/webhook-route";
import { syncLeaderboard } from "@/lib/sync/sync-leaderboard";

export const POST = webhookRoute({
  secret: process.env.CRON_SECRET,
  run: syncLeaderboard,
  message: (r) => `Synced ${r.synced}/${r.total} users${r.failed > 0 ? `, ${r.failed} failed` : ""}`,
});
