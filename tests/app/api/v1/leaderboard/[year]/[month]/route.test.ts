import { beforeEach, describe, expect, test } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/leaderboard/[year]/[month]/route";
import { createSnapshot, createUser } from "@test/db";
import { request, routeContext } from "@test/request";
import { useFakeUpstash } from "@test/upstash";

function get(year: string, month: string) {
  return GET(request(`/api/v1/leaderboard/${year}/${month}`), routeContext({ year, month }));
}

beforeEach(() => {
  useFakeUpstash();
});

describe("GET /api/v1/leaderboard/[year]/[month]", () => {
  test("returns the requested month's ranking", async () => {
    const user = await createUser({ githubUsername: "aysel" });
    await createSnapshot(user.id, "MONTHLY", "2026-07", { commits: 12 });

    const res = await get("2026", "07");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta).toEqual({ month: "2026-07", count: 1, lastSyncedAt: null });
    expect(body.data[0]).toMatchObject({ commits: 12, user: { githubUsername: "aysel" } });
  });

  test("accepts a month without zero padding", async () => {
    const user = await createUser();
    await createSnapshot(user.id, "MONTHLY", "2026-07", { commits: 1 });

    const body = await (await get("2026", "7")).json();
    expect(body.meta.month).toBe("2026-07");
  });

  test.for([
    ["a year before the program started", "2025", "12"],
    ["a year past 2100", "2101", "01"],
    ["month 0", "2026", "0"],
    ["month 13", "2026", "13"],
    ["a non-numeric year", "abcd", "01"],
    ["a fractional month", "2026", "7.5"],
  ])("rejects %s with 400", async ([, year, month]) => {
    const res = await get(year, month);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: { code: "invalid_params", message: "`year` must be 2026-2100 and `month` must be 1-12." },
    });
  });

  test("returns 404 for a valid month without data", async () => {
    const res = await get("2026", "03");
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: { code: "not_found", message: "No leaderboard data for 2026-03." },
    });
    expect(res.headers.get("x-ratelimit-limit")).toBe("20");
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
