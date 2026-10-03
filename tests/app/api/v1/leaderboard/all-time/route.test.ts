import { beforeEach, describe, expect, test } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/leaderboard/all-time/route";
import { createAllTimeStats, createUser } from "@test/db";
import { request } from "@test/request";
import { useFakeUpstash } from "@test/upstash";

beforeEach(() => {
  useFakeUpstash();
});

describe("GET /api/v1/leaderboard/all-time", () => {
  test("returns all-time rankings of non-banned users with meta", async () => {
    const top = await createUser({ githubUsername: "top" });
    const low = await createUser({ githubUsername: "low" });
    const bot = await createUser({ githubUsername: "bot", banned: true });
    await createAllTimeStats(top.id, { commits: 900, updatedAt: new Date("2026-07-01T00:00:00Z") });
    await createAllTimeStats(low.id, { commits: 10, updatedAt: new Date("2026-07-02T00:00:00Z") });
    await createAllTimeStats(bot.id, { commits: 99_999, updatedAt: new Date("2026-07-01T00:00:00Z") });

    const body = await (await GET(request("/api/v1/leaderboard/all-time"), undefined)).json();

    expect(body.meta).toEqual({ count: 2, lastSyncedAt: "2026-07-02T00:00:00.000Z" });
    expect(body.data.map((e: { commits: number }) => e.commits)).toEqual([900, 10]);
    expect(body.data[0]).toEqual({
      userId: top.id,
      commits: 900,
      pullRequests: 0,
      issues: 0,
      reviews: 0,
      user: { githubUsername: "top", name: top.name, image: top.image },
    });
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
