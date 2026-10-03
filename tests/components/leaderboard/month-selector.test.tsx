import type { Key } from "@heroui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { MonthSelector } from "@/components/leaderboard/month-selector";

const months = ["2026-08", "2026-07", "2026-06"];

describe("MonthSelector", () => {
  test("shows the selected month in words", () => {
    render(<MonthSelector months={months} month="2026-07" onMonthChange={() => {}} />);
    expect(screen.getByRole("button", { name: /July 2026/ })).toBeInTheDocument();
  });

  test("lists every month and reports the chosen key", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn<(monthKey: Key) => void>();
    render(<MonthSelector months={months} month="2026-08" onMonthChange={onMonthChange} />);

    await user.click(screen.getByRole("button", { name: /August 2026/ }));
    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["August 2026", "July 2026", "June 2026"]);

    await user.click(screen.getByRole("option", { name: "June 2026" }));

    expect(onMonthChange).toHaveBeenCalledWith("2026-06");
  });
});
