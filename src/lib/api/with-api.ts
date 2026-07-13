import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { apiError } from "./response";

type ApiHandler<C> = (req: NextRequest, ctx: C) => Promise<NextResponse>;

/**
 * Wraps a GET route handler with per-IP rate limiting and a consistent error envelope.
 * The handler builds its own success response via `apiSuccess`; this merges the
 * rate-limit headers onto it. Reading the IP from headers keeps the route request-time
 * (never prerendered), which is required for rate limiting to run on every call.
 */
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
