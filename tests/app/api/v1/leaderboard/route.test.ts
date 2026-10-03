import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/leaderboard/route";
import { createAllTimeStats, createSnapshot, createUser } from "@test/db";
import { request } from "@test/request";
import { useFakeUpstash } from "@test/upstash";

beforeEach(() => {
  useFakeUpstash();
  vi.useFakeTimers({ now: new Date("2026-07-15T12:00:00Z"), toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/v1/leaderboard", () => {
  test("returns the current month's ranking with meta", async () => {
    const a = await createUser({ githubUsername: "a" });
    const b = await createUser({ githubUsername: "b" });
    await createSnapshot(a.id, "MONTHLY", "2026-07", { commits: 3 });
    await createSnapshot(b.id, "MONTHLY", "2026-07", { commits: 8 });
    await createSnapshot(a.id, "MONTHLY", "2026-06", { commits: 100 });
    await createAllTimeStats(a.id, { updatedAt: new Date("2026-07-15T11:00:00Z") });

    const res = await GET(request("/api/v1/leaderboard"), undefined);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta).toEqual({ month: "2026-07", count: 2, lastSyncedAt: "2026-07-15T11:00:00.000Z" });
    expect(body.data.map((e: { user: { githubUsername: string } }) => e.user.githubUsername)).toEqual(["b", "a"]);
  });

  test("returns an empty list (not 404) when the month has no data yet", async () => {
    const res = await GET(request("/api/v1/leaderboard"), undefined);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: [],
      meta: { month: "2026-07", count: 0, lastSyncedAt: null },
    });
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
