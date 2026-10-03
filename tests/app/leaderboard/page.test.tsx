import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import LeaderboardPage, { metadata } from "@/app/leaderboard/page";
import { createAllTimeStats, createSnapshot, createUser } from "@test/db";
import { renderServer } from "@test/render-server";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-07-15T12:00:00Z"), toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LeaderboardPage", () => {
  test("shows the podium and this month's table", async () => {
    for (const [name, commits] of [
      ["gold", 300],
      ["silver", 200],
      ["bronze", 100],
    ] as const) {
      const user = await createUser({ githubUsername: name });
      await createSnapshot(user.id, "MONTHLY", "2026-07", { commits });
      await createAllTimeStats(user.id, { commits, updatedAt: new Date("2026-07-15T11:30:00Z") });
    }

    await renderServer(<LeaderboardPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Monthly Leaderboard");
    expect(screen.getByText("Champion")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /July 2026/ })).toBeInTheDocument();
    const tableRows = screen.getAllByRole("row").slice(1);
    expect(tableRows.map((r) => r.querySelector("a")?.textContent)).toEqual(["gold", "silver", "bronze"]);
  });

  test("shows the sync countdown once stats have synced", async () => {
    const user = await createUser();
    await createAllTimeStats(user.id, { updatedAt: new Date("2026-07-15T11:30:00Z") });

    await renderServer(<LeaderboardPage />);

    // Server markup shows the placeholder; the client ticks it down after hydration.
    expect(screen.getByText("Next sync in --:--")).toBeInTheDocument();
  });

  test("hides the countdown and shows an empty state before the first sync", async () => {
    await renderServer(<LeaderboardPage />);
    expect(screen.queryByText(/Next sync in/)).not.toBeInTheDocument();
    expect(screen.getByText("No contributors yet for this period.")).toBeInTheDocument();
  });

  test("declares its title and canonical URL", () => {
    expect(metadata).toMatchObject({
      title: "Leaderboard",
      alternates: { canonical: "http://localhost:3000/leaderboard" },
    });
  });
});
