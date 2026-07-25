import { webhookRoute } from "@/lib/api/webhook-route";
import { syncBlog } from "@/lib/sync/sync-blog";

export const POST = webhookRoute({
  secret: process.env.BLOG_WEBHOOK_SECRET,
  run: syncBlog,
  message: (r) => `Synced ${r.synced}, skipped ${r.skipped}, failed ${r.failed.length}`,
});
