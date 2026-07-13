import "server-only";
import { NextResponse } from "next/server";

// The Open Data API is public, so responses are cross-origin readable. We deliberately
// omit `s-maxage` so the handler runs on every request (needed for per-IP rate limiting);
// `max-age` only lets the caller's own browser reuse a response for a short window.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const BASE_HEADERS: Record<string, string> = {
  ...CORS_HEADERS,
  "Cache-Control": "public, max-age=60",
  "X-Content-Type-Options": "nosniff",
};

export type ApiMeta = {
  lastSyncedAt?: string | null;
  count?: number;
  month?: string;
};

function mergeHeaders(extra?: Record<string, string>): Headers {
  const headers = new Headers(BASE_HEADERS);
  if (extra) for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return headers;
}

/** Success envelope: `{ data, meta? }`. */
export function apiSuccess<T>(data: T, meta?: ApiMeta, extraHeaders?: Record<string, string>): NextResponse {
  const body = meta ? { data, meta } : { data };
  return NextResponse.json(body, { headers: mergeHeaders(extraHeaders) });
}

/** Error envelope: `{ error: { code, message } }`. */
export function apiError(
  status: number,
  code: string,
  message: string,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status, headers: mergeHeaders(extraHeaders) });
}

/** CORS preflight response. */
export function handleOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: new Headers(CORS_HEADERS) });
}
