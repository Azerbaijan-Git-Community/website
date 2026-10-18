import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { MonthSelector } from "@/components/leaderboard/month-selector";

const months = ["2026-08", "2026-07", "2026-06"];

describe("MonthSelector", () => {
  test("shows the selected month in words", () => {
    render(<MonthSelector months={months} month="2026-06" onMonthChange={() => {}} />);
    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });

  test("steps to the older and newer neighbours", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn<(monthKey: string) => void>();
    render(<MonthSelector months={months} month="2026-07" onMonthChange={onMonthChange} />);

    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-06");

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-08");
  });

  test("disables the arrow at each end", () => {
    const { rerender } = render(<MonthSelector months={months} month="2026-08" onMonthChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeEnabled();

    rerender(<MonthSelector months={months} month="2026-06" onMonthChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
  });

  test("moves with the arrow keys", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn<(monthKey: string) => void>();
    render(<MonthSelector months={months} month="2026-07" onMonthChange={onMonthChange} />);

    screen.getByRole("button", { name: "Previous month" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-08");
  });
});
