import { screen } from "@testing-library/react";
import { cacheTag } from "next/cache";
import { describe, expect, test } from "vitest";
import { HeroVisual } from "@/components/landing/hero-visual";
import { createAllTimeStats, createUser } from "@test/db";
import { renderServer } from "@test/render-server";

async function progressFor(commits: number | null) {
  if (commits !== null) {
    const user = await createUser();
    await createAllTimeStats(user.id, { commits });
  }
  const { container } = await renderServer(<HeroVisual />);
  return container.querySelector<HTMLElement>(".hero-visual")!.style.getPropertyValue("--progress");
}

describe("HeroVisual", () => {
  test("shows the national goal and the current total", async () => {
    const user = await createUser();
    await createAllTimeStats(user.id, { commits: 1234 });

    await renderServer(<HeroVisual />);

    expect(screen.getByText("National 5-Year Target")).toBeInTheDocument();
    expect(screen.getByText("500,000")).toBeInTheDocument();
    // The counter animates up from 0 on the client.
    expect(screen.getByText("Current").nextElementSibling).toHaveTextContent("0");
  });

  test.for([
    [123_456, "24.7%"],
    [250_000, "50%"],
    [499_999, "100%"],
  ] as const)("sets progress for %d commits to %s", async ([commits, progress]) => {
    expect(await progressFor(commits)).toBe(progress);
  });

  test("never shows less than 1% so the bar stays visible", async () => {
    expect(await progressFor(100)).toBe("1%");
  });

  test("shows 1% before any stats exist", async () => {
    expect(await progressFor(null)).toBe("1%");
  });

  test("caps progress at 100% once the goal is exceeded", async () => {
    expect(await progressFor(750_000)).toBe("100%");
  });

  test("is cached with the leaderboard data", async () => {
    await renderServer(<HeroVisual />);
    expect(cacheTag).toHaveBeenCalledWith("leaderboard");
  });
});
