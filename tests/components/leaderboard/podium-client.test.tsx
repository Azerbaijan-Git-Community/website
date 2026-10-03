import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { PodiumClient } from "@/components/leaderboard/podium-client";
import type { LeaderboardEntry } from "@/data/leaderboard/get";

function entry(githubUsername: string, commits: number): LeaderboardEntry {
  return {
    userId: githubUsername,
    commits,
    pullRequests: 0,
    issues: 0,
    reviews: 0,
    user: { githubUsername, name: githubUsername, image: `https://avatars.githubusercontent.com/${githubUsername}` },
  };
}

const usernames = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("PodiumClient", () => {
  test("shows the latest month's top three with medals", () => {
    render(
      <PodiumClient
        allData={{
          "2026-06": [entry("old", 1)],
          "2026-07": [entry("gold", 1500), entry("silver", 900), entry("bronze", 40)],
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /July 2026/ })).toBeInTheDocument();
    expect(usernames()).toEqual(["gold", "silver", "bronze"]);
    expect(screen.getByText("Champion")).toBeInTheDocument();
    expect(screen.getByText("2nd Place")).toBeInTheDocument();
    expect(screen.getByText("3rd Place")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "gold" })).toHaveAttribute("href", "https://github.com/gold");
  });

  test("switches months from the selector", async () => {
    const user = userEvent.setup();
    render(
      <PodiumClient
        allData={{
          "2026-06": [entry("june-winner", 10)],
          "2026-07": [entry("july-winner", 20)],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /July 2026/ }));
    await user.click(await screen.findByRole("option", { name: "June 2026" }));

    expect(usernames()).toEqual(["june-winner"]);
  });

  test("renders only the places that are filled", () => {
    render(<PodiumClient allData={{ "2026-07": [entry("solo", 3)] }} />);
    expect(usernames()).toEqual(["solo"]);
    expect(screen.queryByText("2nd Place")).not.toBeInTheDocument();
  });

  test("falls back to the previous month when the latest month is still empty", () => {
    render(<PodiumClient allData={{ "2026-08": [], "2026-07": [entry("july-winner", 20)] }} />);
    expect(usernames()).toEqual(["july-winner"]);
  });

  test("renders an empty podium when there is no data", () => {
    render(<PodiumClient allData={{}} />);
    expect(screen.queryAllByRole("heading", { level: 3 })).toEqual([]);
  });
});
