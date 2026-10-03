import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
});

async function loadServerEnv() {
  return (await import("@/lib/env.server")).serverEnv;
}

describe("serverEnv", () => {
  test("exposes validated server and client variables", async () => {
    const env = await loadServerEnv();
    expect(env).toMatchObject({
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
      CRON_SECRET: "test-cron-secret",
      GH_STATS_TOKEN: "test-gh-token",
    });
  });

  test("treats BETTER_AUTH_API_KEY as optional", async () => {
    vi.stubEnv("BETTER_AUTH_API_KEY", undefined);
    expect((await loadServerEnv()).BETTER_AUTH_API_KEY).toBeUndefined();
  });

  test("lists every invalid variable in the thrown error", async () => {
    vi.stubEnv("CRON_SECRET", undefined);
    vi.stubEnv("GH_STATS_TOKEN", "ab");
    const loading = loadServerEnv();
    await expect(loading).rejects.toThrow("CRON_SECRET");
    await expect(loading).rejects.toThrow("GH_STATS_TOKEN");
  });

  test("validates the shared client variables too", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "not-a-url");
    await expect(loadServerEnv()).rejects.toThrow("NEXT_PUBLIC_BASE_URL");
  });

  // `.env.example` and the rate-limit module document Upstash as optional ("the API fails open"),
  // but the schema requires both variables, so the app refuses to boot without them.
  test("BUG-02: boots without Upstash credentials (documented as optional)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);
    await expect(loadServerEnv()).resolves.toBeDefined();
  });
});
