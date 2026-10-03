import { beforeEach, describe, expect, test } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/stats/route";
import { StatsSchema } from "@/lib/api/schemas";
import { createAllTimeStats, createUser } from "@test/db";
import { request } from "@test/request";
import { upstash, useFakeUpstash } from "@test/upstash";

beforeEach(() => {
  useFakeUpstash();
});

describe("GET /api/v1/stats", () => {
  test("returns community totals and the last sync time", async () => {
    const user = await createUser();
    await createAllTimeStats(user.id, { commits: 42, pullRequests: 7, updatedAt: new Date("2026-07-01T10:00:00Z") });

    const res = await GET(request("/api/v1/stats"), undefined);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      data: { totalCommits: 42, totalPullRequests: 7, totalUsers: 1, lastSyncedAt: "2026-07-01T10:00:00.000Z" },
    });
    expect(StatsSchema.parse(body.data)).toEqual(body.data);
  });

  test("reports a null sync time before the first sync", async () => {
    const res = await GET(request("/api/v1/stats"), undefined);
    await expect(res.json()).resolves.toEqual({
      data: { totalCommits: 0, totalPullRequests: 0, totalUsers: 0, lastSyncedAt: null },
    });
  });

  test("includes CORS and rate-limit headers", async () => {
    const res = await GET(request("/api/v1/stats"), undefined);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("x-ratelimit-limit")).toBe("20");
    expect(res.headers.get("x-ratelimit-limit-daily")).toBe("500");
  });

  test("is rate limited per IP", async () => {
    upstash.setUsage("odapi:min", "198.51.100.1", 20);
    const res = await GET(request("/api/v1/stats", { headers: { "x-forwarded-for": "198.51.100.1" } }), undefined);
    expect(res.status).toBe(429);
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
