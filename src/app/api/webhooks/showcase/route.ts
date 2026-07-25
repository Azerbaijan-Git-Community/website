import { webhookRoute } from "@/lib/api/webhook-route";
import { syncShowcase } from "@/lib/sync/sync-showcase";

export const POST = webhookRoute({
  secret: process.env.SHOWCASE_WEBHOOK_SECRET,
  run: syncShowcase,
  message: (r) => `Synced ${r.synced} projects, skipped ${r.skipped} unchanged`,
});
