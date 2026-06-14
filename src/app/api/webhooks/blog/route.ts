import { NextRequest, NextResponse } from "next/server";
import { isValidSecret } from "@/lib/crypto";
import { syncBlog } from "@/lib/sync/sync-blog";
import { getBearerToken } from "@/lib/utils.server";

export async function POST(req: NextRequest) {
  const providedSecret = getBearerToken(req);
  if (!isValidSecret(providedSecret, process.env.BLOG_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncBlog();

  return NextResponse.json({
    ok: true,
    ...result,
    message: `Synced ${result.synced}, skipped ${result.skipped}, failed ${result.failed.length}`,
  });
}
