import { webhookRoute } from "@/lib/api/webhook-route";
import { serverEnv } from "@/lib/env.server";
import { syncShowcase } from "@/lib/sync/sync-showcase";

export const POST = webhookRoute({
  secret: serverEnv.SHOWCASE_WEBHOOK_SECRET,
  run: syncShowcase,
  message: (r) => `Synced ${r.synced} projects, skipped ${r.skipped} unchanged, deleted ${r.deleted}`,
});
