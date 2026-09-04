import { webhookRoute } from "@/lib/api/webhook-route";
import { serverEnv } from "@/lib/env.server";
import { syncShowcaseData } from "@/lib/sync/sync-showcase";

export const POST = webhookRoute({
  secret: serverEnv.CRON_SECRET,
  run: syncShowcaseData,
  message: (r) => `Refreshed GitHub data for ${r.synced} projects`,
});
