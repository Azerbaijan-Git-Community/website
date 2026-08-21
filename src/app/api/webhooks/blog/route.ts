import { webhookRoute } from "@/lib/api/webhook-route";
import { serverEnv } from "@/lib/env.server";
import { syncBlog } from "@/lib/sync/sync-blog";

export const POST = webhookRoute({
  secret: serverEnv.BLOG_WEBHOOK_SECRET,
  run: syncBlog,
  message: (r) => `Synced ${r.synced}, skipped ${r.skipped}, failed ${r.failed.length}`,
});
