import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SyncCountdown } from "@/components/leaderboard/sync-countdown";

function advance(ms: number) {
  return act(() => vi.advanceTimersByTime(ms));
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-07-15T10:15:00Z") });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SyncCountdown", () => {
  test("counts down to the next hourly sync, every second", async () => {
    render(<SyncCountdown lastSync={new Date("2026-07-15T10:00:00Z")} />);
    expect(screen.getByText("Next sync in 45:00")).toBeInTheDocument();

    await advance(1000);
    expect(screen.getByText("Next sync in 44:59")).toBeInTheDocument();

    await advance(60_000);
    expect(screen.getByText("Next sync in 43:59")).toBeInTheDocument();
  });

  test("shows a spinning 'Syncing...' state once the sync is due", () => {
    const { container } = render(<SyncCountdown lastSync={new Date("2026-07-15T09:00:00Z")} />);
    expect(screen.getByText("Syncing...")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });

  test("flips to syncing exactly when the hour is up", async () => {
    render(<SyncCountdown lastSync={new Date("2026-07-15T09:15:02Z")} />);
    expect(screen.getByText("Next sync in 00:02")).toBeInTheDocument();

    await advance(2000);
    expect(screen.getByText("Syncing...")).toBeInTheDocument();
  });

  test("restarts the countdown when a new sync time arrives", () => {
    const { rerender } = render(<SyncCountdown lastSync={new Date("2026-07-15T09:00:00Z")} />);
    rerender(<SyncCountdown lastSync={new Date("2026-07-15T10:14:00Z")} />);
    expect(screen.getByText("Next sync in 59:00")).toBeInTheDocument();
  });

  test("stops ticking after unmount", () => {
    const { unmount } = render(<SyncCountdown lastSync={new Date("2026-07-15T10:00:00Z")} />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
