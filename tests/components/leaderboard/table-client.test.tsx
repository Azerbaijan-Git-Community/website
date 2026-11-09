import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { SCROLL_TO_ME_KEY } from "@/components/leaderboard/scroll-to-me";
import { TableClient } from "@/components/leaderboard/table-client";
import type { AllTableData, LeaderboardEntry } from "@/data/leaderboard/get";

function entry(githubUsername: string, commits: number, extra: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    userId: githubUsername,
    commits,
    pullRequests: 0,
    issues: 0,
    reviews: 0,
    user: { githubUsername, name: githubUsername, image: `https://avatars.githubusercontent.com/${githubUsername}` },
    ...extra,
  };
}

const data: AllTableData = {
  weekly: [entry("weekly-star", 12)],
  monthly: [
    entry("first", 2500, { pullRequests: 1200, issues: 3, reviews: 4 }),
    entry("second", 800),
    entry("third", 600),
    entry("fourth", 20),
  ],
  allTime: [entry("veteran", 99_000), entry("first", 2500)],
};

/** Usernames in the desktop table, in rank order. */
const tableRows = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getByRole("link").textContent);

describe("TableClient", () => {
  test("starts on this month's ranking", () => {
    render(<TableClient allData={data} />);
    expect(screen.getByRole("button", { name: "This Month" })).toHaveClass("bg-green");
    expect(tableRows()).toEqual(["first", "second", "third", "fourth"]);
  });

  test("shows medals for the top three and numbered ranks after", () => {
    render(<TableClient allData={data} />);
    const ranks = within(screen.getByRole("table"))
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0].textContent);
    expect(ranks).toEqual(["🥇", "🥈", "🥉", "#4"]);
  });

  test("formats every stat column", () => {
    render(<TableClient allData={data} />);
    const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(
      within(firstRow)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["🥇", "first", "2,500", "1,200", "3", "4"]);
    expect(within(firstRow).getByRole("link")).toHaveAttribute("href", "https://github.com/first");
  });

  test("also renders mobile cards for every contributor", () => {
    render(<TableClient allData={data} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "first",
      "second",
      "third",
      "fourth",
    ]);
  });

  test.for([
    ["This Week", ["weekly-star"]],
    ["Last Year", ["veteran", "first"]],
  ] as const)("switches to %s", async ([tab, rows]) => {
    const user = userEvent.setup();
    render(<TableClient allData={data} />);

    await user.click(screen.getByRole("button", { name: tab }));

    // Rows of the previous period fade out (AnimatePresence) before they unmount.
    await waitFor(() => expect(tableRows()).toEqual(rows));
  });

  test("shows an empty state when this month has no contributors", () => {
    render(<TableClient allData={{ weekly: [], monthly: [], allTime: [] }} />);
    expect(screen.getByText("No contributors yet for this period.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("BUG-15: keeps the period tabs available when the selected period is empty", async () => {
    const user = userEvent.setup();
    render(<TableClient allData={{ ...data, weekly: [] }} />);

    await user.click(screen.getByRole("button", { name: "This Week" }));
    expect(screen.getByText("No contributors yet for this period.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "This Month" }));
    await waitFor(() => expect(tableRows()).toEqual(["first", "second", "third", "fourth"]));
    expect(tableRows()).toEqual(["first", "second", "third", "fourth"]);
  });

  test("BUG-15: lets visitors reach other periods when the current month is still empty", () => {
    render(<TableClient allData={{ ...data, monthly: [] }} />);
    expect(screen.getByRole("button", { name: "Last Year" })).toBeInTheDocument();
  });
});

describe("TableClient for a signed-in member", () => {
  test("highlights the member's row and labels it", () => {
    render(<TableClient allData={data} currentUserId="second" />);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);

    expect(rows[1]).toHaveAttribute("aria-current", "true");
    expect(within(rows[1]).getByText("You")).toBeInTheDocument();
    expect(rows[0]).not.toHaveAttribute("aria-current");
    expect(within(rows[0]).queryByText("You")).not.toBeInTheDocument();
  });

  test("highlights nobody for visitors", () => {
    render(<TableClient allData={data} />);
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  test("scrolls to the member once after the welcome flow, then forgets the request", async () => {
    const scrollIntoView = vi.fn<Element["scrollIntoView"]>();
    Element.prototype.scrollIntoView = scrollIntoView;
    sessionStorage.setItem(SCROLL_TO_ME_KEY, "1");

    render(<TableClient allData={data} currentUserId="third" />);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView.mock.contexts[0]).toHaveAttribute("data-me");
    expect(sessionStorage.getItem(SCROLL_TO_ME_KEY)).toBeNull();
  });

  test("doesn't scroll on ordinary visits", () => {
    const scrollIntoView = vi.fn<Element["scrollIntoView"]>();
    Element.prototype.scrollIntoView = scrollIntoView;
    sessionStorage.removeItem(SCROLL_TO_ME_KEY);

    render(<TableClient allData={data} currentUserId="third" />);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
