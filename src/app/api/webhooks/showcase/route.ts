import { NextRequest, NextResponse } from "next/server";
import { isValidSecret } from "@/lib/crypto";
import { syncShowcase } from "@/lib/sync/sync-showcase";
import { getBearerToken } from "@/lib/utils.server";

export async function POST(req: NextRequest) {
  const providedSecret = getBearerToken(req);
  if (!isValidSecret(providedSecret, process.env.SHOWCASE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncShowcase();

  return NextResponse.json({
    ok: true,
    ...result,
    message: `Synced ${result.synced} projects, skipped ${result.skipped} unchanged`,
  });
}
