import { afterEach, describe, expect, test, vi } from "vitest";
import { formatDate, formatMonthKey, formatTime, getLatestMonthKey, getTimeLeft } from "@/lib/utils.client";

describe("formatDate", () => {
  test("formats Date objects and ISO strings the same way", () => {
    expect(formatDate(new Date("2026-03-05T12:00:00Z"))).toBe("Mar 5, 2026");
    expect(formatDate("2026-03-05T12:00:00Z")).toBe("Mar 5, 2026");
  });
});

describe("formatMonthKey", () => {
  test.for([
    ["2026-01", "January 2026"],
    ["2026-12", "December 2026"],
    ["2027-07", "July 2027"],
  ])("formats %s as %s", ([key, label]) => {
    expect(formatMonthKey(key)).toBe(label);
  });
});

describe("getLatestMonthKey", () => {
  test("returns the most recent YYYY-MM key", () => {
    expect(getLatestMonthKey({ "2026-02": [], "2026-11": [], "2025-12": [] })).toBe("2026-11");
  });

  test("returns an empty string when there are no keys", () => {
    expect(getLatestMonthKey({})).toBe("");
  });
});

describe("getTimeLeft", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns 0 when there was never a sync", () => {
    expect(getTimeLeft(null)).toBe(0);
  });

  test("counts down to one hour after the last sync", () => {
    vi.useFakeTimers({ now: new Date("2026-05-01T10:15:00Z") });
    expect(getTimeLeft(new Date("2026-05-01T10:00:00Z"))).toBe(45 * 60 * 1000);
  });

  test("never goes negative once the next sync is overdue", () => {
    vi.useFakeTimers({ now: new Date("2026-05-01T12:00:00Z") });
    expect(getTimeLeft(new Date("2026-05-01T10:00:00Z"))).toBe(0);
  });
});

describe("formatTime", () => {
  test.for([
    [0, "00:00"],
    [999, "00:00"],
    [61_000, "01:01"],
    [59 * 60_000 + 59_000, "59:59"],
    [3_600_000, "1:00:00"],
    [3_600_000 + 5 * 60_000 + 7_000, "1:05:07"],
    [25 * 3_600_000, "25:00:00"],
  ] as const)("formats %d ms as %s", ([ms, label]) => {
    expect(formatTime(ms)).toBe(label);
  });
});
