import { describe, expect, test } from "vitest";
import { apiError, apiSuccess, handleOptions } from "@/lib/api/response";

describe("apiSuccess", () => {
  test("wraps data in an envelope without meta by default", async () => {
    const res = apiSuccess([1, 2]);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: [1, 2] });
  });

  test("includes meta when given", async () => {
    const res = apiSuccess([], { count: 0, month: "2026-07", lastSyncedAt: null });
    await expect(res.json()).resolves.toEqual({ data: [], meta: { count: 0, month: "2026-07", lastSyncedAt: null } });
  });

  test("sets public CORS, caching and nosniff headers", () => {
    const res = apiSuccess({});
    expect(Object.fromEntries(res.headers)).toMatchObject({
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      "cache-control": "public, max-age=60",
      "x-content-type-options": "nosniff",
      "content-type": "application/json",
    });
  });

  test("merges extra headers, letting them override the defaults", () => {
    const res = apiSuccess({}, undefined, { "X-RateLimit-Limit": "20", "Cache-Control": "no-store" });
    expect(res.headers.get("x-ratelimit-limit")).toBe("20");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("apiError", () => {
  test("returns the error envelope with the given status", async () => {
    const res = apiError(404, "not_found", "Nothing here.");
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: { code: "not_found", message: "Nothing here." } });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  test("attaches extra headers such as Retry-After", () => {
    expect(apiError(429, "rate_limited", "Slow down", { "Retry-After": "12" }).headers.get("retry-after")).toBe("12");
  });
});

describe("handleOptions", () => {
  test("answers CORS preflight with 204 and only the CORS headers", async () => {
    const res = handleOptions();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(res.headers.get("access-control-allow-methods")).toBe("GET, OPTIONS");
    expect(res.headers.get("cache-control")).toBeNull();
  });
});
