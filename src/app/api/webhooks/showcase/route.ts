import { NextRequest, NextResponse } from "next/server";
import { syncShowcase } from "@/lib/sync-showcase";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.SHOWCASE_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncShowcase();

  return NextResponse.json({
    ok: true,
    ...result,
    message: `Synced ${result.synced} projects, removed ${result.removed}`,
  });
}
