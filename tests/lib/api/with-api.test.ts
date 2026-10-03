import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { withApi } from "@/lib/api/with-api";
import { upstash, useFakeUpstash } from "@test/upstash";

function request(ip: string) {
  return new NextRequest("http://localhost:3000/api/v1/test", { headers: { "x-forwarded-for": ip } });
}

describe("withApi", () => {
  beforeEach(() => {
    useFakeUpstash();
  });

  test("runs the handler and adds rate-limit headers to its response", async () => {
    const route = withApi(async () => NextResponse.json({ data: "hi" }));
    const res = await route(request("20.0.0.1"), undefined);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: "hi" });
    expect(res.headers.get("x-ratelimit-limit")).toBe("20");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("19");
  });

  test("passes the request and route context through", async () => {
    type Ctx = { params: Promise<{ slug: string }> };
    const handler = vi.fn<(req: NextRequest, ctx: Ctx) => Promise<NextResponse>>(async (_req, ctx) =>
      NextResponse.json(await ctx.params),
    );
    const res = await withApi(handler)(request("20.0.0.2"), { params: Promise.resolve({ slug: "a" }) });
    await expect(res.json()).resolves.toEqual({ slug: "a" });
    expect(handler.mock.calls[0][0].url).toBe("http://localhost:3000/api/v1/test");
  });

  test("returns 429 without running the handler when rate limited", async () => {
    upstash.setUsage("odapi:min", "20.0.0.3", 20);
    const handler = vi.fn<() => Promise<NextResponse>>(async () => NextResponse.json({}));
    const res = await withApi(handler)(request("20.0.0.3"), undefined);

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({
      error: { code: "rate_limited", message: "Rate limit exceeded. Try again later." },
    });
    expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(handler).not.toHaveBeenCalled();
  });

  test("turns handler errors into a 500 envelope without leaking details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await withApi(async () => {
      throw new Error("db password is hunter2");
    })(request("20.0.0.4"), undefined);

    expect(res.status).toBe(500);
    const body = await res.text();
    expect(JSON.parse(body)).toEqual({ error: { code: "internal_error", message: "Something went wrong." } });
    expect(body).not.toContain("hunter2");
    expect(res.headers.get("x-ratelimit-limit")).toBe("20");
    expect(log).toHaveBeenCalledWith("Open Data API handler error:", expect.any(Error));
  });

  // An Upstash outage currently rejects before the try/catch, so every public endpoint throws.
  test("BUG-04: keeps serving (fails open) when the rate-limit backend is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    upstash.failWith = 503;
    const res = await withApi(async () => NextResponse.json({ data: "still up" }))(request("20.0.0.5"), undefined);
    expect(res.status).toBe(200);
  });
});
