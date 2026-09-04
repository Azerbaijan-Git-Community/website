import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { apiError } from "./response";

type ApiHandler<C> = (req: NextRequest, ctx: C) => Promise<NextResponse>;

// Wraps a GET handler with per-IP rate limiting and a consistent error envelope, merging
// rate-limit headers onto its response. Reading the IP keeps the route request-time (never prerendered).
export function withApi<C = unknown>(handler: ApiHandler<C>): ApiHandler<C> {
  return async (req, ctx) => {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(ip);

    if (!rl.ok) {
      return apiError(429, "rate_limited", "Rate limit exceeded. Try again later.", rl.headers);
    }

    try {
      const res = await handler(req, ctx);
      for (const [key, value] of Object.entries(rl.headers)) res.headers.set(key, value);
      return res;
    } catch (error) {
      console.error("Open Data API handler error:", error);
      return apiError(500, "internal_error", "Something went wrong.", rl.headers);
    }
  };
}
