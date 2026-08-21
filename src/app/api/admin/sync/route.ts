import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { SYNC_TARGETS, type SyncTarget } from "@/lib/constants";
import { clientEnv } from "@/lib/env.client";
import { serverEnv } from "@/lib/env.server";
import { syncShowcaseData } from "@/lib/sync/sync-showcase";
import { ResponseSchema } from "@/lib/utils";

/**
 * Builds the outgoing request (URL + auth header) for a sync target, mirroring
 * exactly what the GitHub Actions workflows send to each endpoint.
 */
function buildSyncRequest(target: SyncTarget): { url: string; headers: Record<string, string> } {
  const base = clientEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");

  switch (target) {
    case "blog":
      return {
        url: `${base}/api/webhooks/blog`,
        headers: { Authorization: `Bearer ${serverEnv.BLOG_WEBHOOK_SECRET}` },
      };
    case "showcase":
      return {
        url: `${base}/api/webhooks/showcase`,
        headers: { Authorization: `Bearer ${serverEnv.SHOWCASE_WEBHOOK_SECRET}` },
      };
    case "github":
      return {
        url: `${base}/api/webhooks/leaderboard`,
        headers: { Authorization: `Bearer ${serverEnv.CRON_SECRET}` },
      };
    default:
      throw new Error(`Unknown sync target: ${target}`);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = z.object({ target: z.enum(SYNC_TARGETS) }).safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid sync target" }, { status: 400 });
  }

  if (body.data.target === "showcase-data") {
    const result = await syncShowcaseData();
    return NextResponse.json({ message: `Refreshed GitHub data for ${result.synced} projects` });
  }

  const { url, headers: syncHeaders } = buildSyncRequest(body.data.target);

  const res = await fetch(url, {
    method: "POST",
    headers: { ...syncHeaders, "Content-Type": "application/json" },
    cache: "no-store",
    redirect: "manual",
  });

  const data = ResponseSchema.parse(await res.json().catch(() => ({})));

  return NextResponse.json(data, { status: res.status });
}
