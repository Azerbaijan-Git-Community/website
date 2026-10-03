import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { PeriodSelector } from "@/components/leaderboard/period-selector";
import type { LeaderboardPeriod } from "@/data/leaderboard/get";

describe("PeriodSelector", () => {
  test("labels the all-time tab 'Last Year' (GitHub's contribution window)", () => {
    render(<PeriodSelector period="monthly" onTabChange={() => {}} />);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["This Week", "This Month", "Last Year"]);
  });

  test("highlights the active period", () => {
    render(<PeriodSelector period="allTime" onTabChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Last Year" })).toHaveClass("bg-green");
    expect(screen.getByRole("button", { name: "This Week" })).not.toHaveClass("bg-green");
  });

  test.for([
    ["This Week", "weekly"],
    ["This Month", "monthly"],
    ["Last Year", "allTime"],
  ])("reports %s as %s", async ([label, period]) => {
    const user = userEvent.setup();
    const onTabChange = vi.fn<(tab: LeaderboardPeriod) => void>();
    render(<PeriodSelector period="monthly" onTabChange={onTabChange} />);

    await user.click(screen.getByRole("button", { name: label }));

    expect(onTabChange).toHaveBeenCalledWith(period);
  });
});
