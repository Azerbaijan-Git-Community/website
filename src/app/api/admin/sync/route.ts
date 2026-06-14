import { serverEnv } from "@/lib/env.server";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SYNC_TARGETS, type SyncTarget } from "@/lib/constants";
import { clientEnv } from "@/lib/env.client";

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
        url: `${base}/api/cron/sync-github`,
        headers: { "x-cron-secret": serverEnv.CRON_SECRET },
      };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { target?: string } | null;
  const target = body?.target;

  if (!target || !SYNC_TARGETS.includes(target as SyncTarget)) {
    return NextResponse.json({ error: "Invalid sync target" }, { status: 400 });
  }

  const { url, headers: syncHeaders } = buildSyncRequest(target as SyncTarget);

  const res = await fetch(url, {
    method: "POST",
    headers: { ...syncHeaders, "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  return NextResponse.json(data, { status: res.status });
}
