import { serverEnv } from "@/lib/env.server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import "server-only";
import type { NextRequest } from "next/server";

// Per-IP limits for the public Open Data API.
const MINUTE_LIMIT = 20;
const DAILY_LIMIT = 500;

export type RateLimitResult = {
  /** false when a limit is exceeded. */
  ok: boolean;
  /** Response headers to attach (X-RateLimit-*, and Retry-After when blocked). */
  headers: Record<string, string>;
};

type Limiters = { minute: Ratelimit; daily: Ratelimit };

let limiters: Limiters | null | undefined;

// Lazily build the limiters. Returns null when Upstash is not configured, in which
// case the API fails open (no rate limiting) — keeps local dev/previews working.
function getLimiters(): Limiters | null {
  if (limiters !== undefined) return limiters;

  const url = serverEnv.UPSTASH_REDIS_REST_URL;
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiters = null;
    return null;
  }

  const redis = new Redis({ url, token });
  limiters = {
    minute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MINUTE_LIMIT, "60 s"),
      prefix: "odapi:min",
      analytics: false,
    }),
    daily: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(DAILY_LIMIT, "1 d"),
      prefix: "odapi:day",
      analytics: false,
    }),
  };
  return limiters;
}

// `x-vercel-forwarded-for` is set by Vercel's edge to the real client IP and can't be spoofed
// by the caller, so it's preferred over the client-appendable `x-forwarded-for`.
const IP_HEADERS = ["x-vercel-forwarded-for", "x-forwarded-for", "x-real-ip"] as const;

/** Extract the caller's IP from proxy headers (first hop). */
export function getClientIp(req: NextRequest): string {
  for (const header of IP_HEADERS) {
    const first = req.headers.get(header)?.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

/** Check both the minute and monthly limits for an IP and produce standard headers. */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const l = getLimiters();
  if (!l) return { ok: true, headers: {} };

  const [minute, daily] = await Promise.all([l.minute.limit(ip), l.daily.limit(ip)]);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(MINUTE_LIMIT),
    "X-RateLimit-Remaining": String(Math.max(0, minute.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(minute.reset / 1000)),
    "X-RateLimit-Limit-Daily": String(DAILY_LIMIT),
    "X-RateLimit-Remaining-Daily": String(Math.max(0, daily.remaining)),
    "X-RateLimit-Reset-Daily": String(Math.ceil(daily.reset / 1000)),
  };

  const ok = minute.success && daily.success;
  if (!ok) {
    // Retry-After = seconds until the exceeded window resets.
    const blockedReset = !minute.success ? minute.reset : daily.reset;
    const retryAfter = Math.max(1, Math.ceil((blockedReset - Date.now()) / 1000));
    headers["Retry-After"] = String(retryAfter);
  }

  return { ok, headers };
}
