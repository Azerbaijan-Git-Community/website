import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { getBearerToken, getMonthKey, getWeekKey } from "@/lib/utils.server";

function requestWithAuth(value?: string) {
  return new NextRequest("http://localhost:3000/api", value === undefined ? {} : { headers: { authorization: value } });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("getBearerToken", () => {
  test("extracts the token from a Bearer header", () => {
    expect(getBearerToken(requestWithAuth("Bearer abc123"))).toBe("abc123");
  });

  test("trims surrounding whitespace", () => {
    expect(getBearerToken(requestWithAuth("Bearer   abc123  "))).toBe("abc123");
  });

  test.for([
    ["no header", undefined],
    ["a Basic header", "Basic dXNlcjpwYXNz"],
    ["a bare token", "abc123"],
  ] as const)("returns null for %s", ([, value]) => {
    expect(getBearerToken(requestWithAuth(value))).toBeNull();
  });
});

describe("getMonthKey", () => {
  test("zero-pads the month", () => {
    expect(getMonthKey(new Date("2026-03-15T00:00:00Z"))).toBe("2026-03");
  });

  test("uses the UTC calendar month", () => {
    expect(getMonthKey(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12");
    expect(getMonthKey(new Date("2027-01-01T00:00:00Z"))).toBe("2027-01");
  });

  test("defaults to now", () => {
    vi.useFakeTimers({ now: new Date("2026-08-10T00:00:00Z") });
    expect(getMonthKey()).toBe("2026-08");
  });
});

describe("getWeekKey", () => {
  test.for([
    // ISO-8601 weeks: week 1 is the one containing the year's first Thursday.
    ["2026-01-01T12:00:00Z", "2026-W01"],
    ["2026-01-04T12:00:00Z", "2026-W01"],
    ["2026-01-05T12:00:00Z", "2026-W02"],
    ["2026-12-31T12:00:00Z", "2026-W53"],
    ["2027-01-03T12:00:00Z", "2026-W53"],
    ["2027-01-04T12:00:00Z", "2027-W01"],
    ["2024-12-30T12:00:00Z", "2025-W01"],
  ])("maps %s to %s", ([iso, key]) => {
    expect(getWeekKey(new Date(iso))).toBe(key);
  });

  test("defaults to now", () => {
    vi.useFakeTimers({ now: new Date("2026-01-05T08:00:00Z") });
    expect(getWeekKey()).toBe("2026-W02");
  });

  // Sunday 22:00 UTC is already Monday 02:00 in Baku (UTC+4); week keys must follow UTC like getMonthKey.
  test.fails("BUG-01: uses the UTC week regardless of the server timezone", () => {
    vi.stubEnv("TZ", "Asia/Baku");
    expect(getWeekKey(new Date("2026-01-04T22:00:00Z"))).toBe("2026-W01");
  });
});
