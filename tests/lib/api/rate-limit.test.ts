import { beforeEach, describe, expect, test, vi } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { upstash, useFakeUpstash } from "@test/upstash";

function requestFrom(headers: Record<string, string>) {
  return new Request("http://localhost:3000/api/v1/stats", { headers });
}

describe("getClientIp", () => {
  test("prefers Vercel's unspoofable header", () => {
    const req = requestFrom({
      "x-vercel-forwarded-for": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
      "x-real-ip": "3.3.3.3",
    });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  test("falls back to the first x-forwarded-for hop, trimmed", () => {
    expect(getClientIp(requestFrom({ "x-forwarded-for": " 2.2.2.2 , 10.0.0.1" }))).toBe("2.2.2.2");
  });

  test("falls back to x-real-ip", () => {
    expect(getClientIp(requestFrom({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
  });

  test("skips empty headers", () => {
    expect(getClientIp(requestFrom({ "x-vercel-forwarded-for": " ", "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
  });

  test("returns 'unknown' without proxy headers", () => {
    expect(getClientIp(requestFrom({}))).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    useFakeUpstash();
  });

  test("allows the first request and reports remaining quota", async () => {
    const before = Date.now();
    const { ok, headers } = await checkRateLimit("10.0.0.1");

    expect(ok).toBe(true);
    expect(headers).toMatchObject({
      "X-RateLimit-Limit": "20",
      "X-RateLimit-Remaining": "19",
      "X-RateLimit-Limit-Daily": "500",
      "X-RateLimit-Remaining-Daily": "499",
    });
    expect(headers).not.toHaveProperty("Retry-After");
    const reset = Number(headers["X-RateLimit-Reset"]);
    expect(reset).toBeGreaterThan(before / 1000);
    expect(reset).toBeLessThanOrEqual(before / 1000 + 61);
  });

  test("counts consecutive requests from the same IP", async () => {
    await checkRateLimit("10.0.0.2");
    const { headers } = await checkRateLimit("10.0.0.2");
    expect(headers["X-RateLimit-Remaining"]).toBe("18");
    expect(headers["X-RateLimit-Remaining-Daily"]).toBe("498");
  });

  test("tracks IPs independently", async () => {
    await checkRateLimit("10.0.0.3");
    const { headers } = await checkRateLimit("10.0.0.4");
    expect(headers["X-RateLimit-Remaining"]).toBe("19");
  });

  test("blocks the 21st request in a minute with a Retry-After", async () => {
    upstash.setUsage("odapi:min", "10.0.0.5", 20);
    const { ok, headers } = await checkRateLimit("10.0.0.5");

    expect(ok).toBe(false);
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    const retryAfter = Number(headers["Retry-After"]);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  test("blocks once the daily quota is spent, with Retry-After until the day resets", async () => {
    upstash.setUsage("odapi:day", "10.0.0.6", 500);
    const { ok, headers } = await checkRateLimit("10.0.0.6");

    expect(ok).toBe(false);
    expect(headers["X-RateLimit-Remaining"]).toBe("19");
    expect(headers["X-RateLimit-Remaining-Daily"]).toBe("0");
    const retryAfter = Number(headers["Retry-After"]);
    const secondsUntilUtcMidnight = Math.ceil((86_400_000 - (Date.now() % 86_400_000)) / 1000);
    expect(retryAfter).toBeLessThanOrEqual(secondsUntilUtcMidnight);
    expect(retryAfter).toBeGreaterThanOrEqual(secondsUntilUtcMidnight - 5);
  });

  test("fails open and logs when Upstash is down", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    upstash.failWith = 503;

    await expect(checkRateLimit("10.0.0.7")).resolves.toEqual({ ok: true, headers: {} });
    expect(log).toHaveBeenCalledWith("Rate limit check failed, allowing request:", expect.any(Error));
  });
});

describe("checkRateLimit without Upstash", () => {
  test("fails open with no headers", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);
    vi.resetModules();
    const { checkRateLimit: check } = await import("@/lib/api/rate-limit");

    await expect(check("1.1.1.1")).resolves.toEqual({ ok: true, headers: {} });
  });
});
