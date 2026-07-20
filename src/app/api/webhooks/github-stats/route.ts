import { webhookRoute } from "@/lib/api/webhook-route";
import { syncGithubStats } from "@/lib/sync/sync-github-stats";

export const POST = webhookRoute({
  secret: process.env.CRON_SECRET,
  run: syncGithubStats,
  message: (r) => `Synced ${r.synced}/${r.total} users${r.failed > 0 ? `, ${r.failed} failed` : ""}`,
});
