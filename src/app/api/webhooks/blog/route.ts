import { NextRequest, NextResponse } from "next/server";
import { syncBlog } from "@/lib/sync-blog";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.BLOG_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncBlog();

  return NextResponse.json({
    ok: true,
    ...result,
    message: `Synced ${result.synced}, skipped ${result.skipped}, removed ${result.removed}`,
  });
}
