import { webhookRoute } from "@/lib/api/webhook-route";
import { serverEnv } from "@/lib/env.server";
import { reconcileAllAccounts } from "@/lib/sync/sync-omicron";

export const POST = webhookRoute({
  secret: serverEnv.CRON_SECRET,
  run: reconcileAllAccounts,
  message: (r) => `Reconciled ${r.synced} accounts, failed ${r.failed.length}`,
});
