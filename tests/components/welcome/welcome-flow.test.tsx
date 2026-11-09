import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SCROLL_TO_ME_KEY } from "@/components/leaderboard/scroll-to-me";
import { WelcomeFlow } from "@/components/welcome/welcome-flow";
import { getMonthKey, getWeekKey } from "@/lib/utils.server";
import { sessionHeadersFor } from "@test/auth";
import { createAllTimeStats, createOmicronConnection, createSnapshot, createUser } from "@test/db";
import { fakeGraphQL } from "@test/github";
import { server } from "@test/msw";
import { incomingRequest } from "@test/next-headers";
import { renderWithRouter } from "@test/next-router";

vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

// The sync screen stays up for at least 1.2s, so results need a longer wait than findBy's default.
const AFTER_SYNC = { timeout: 4000 };

function serveClientSession(user: { id: string; name: string; image: string } | null) {
  server.use(
    http.get("http://localhost:3000/api/auth/get-session", () =>
      HttpResponse.json(user ? { user, session: { id: "s1", userId: user.id } } : null),
    ),
  );
}

/** A signed-in member whose stats are fresh, so the flow ranks them without calling GitHub. */
async function signInWithStats(commits: { weekly: number; monthly: number; allTime: number }) {
  const user = await createUser({ name: "Aysel", githubUsername: "aysel" });
  await createSnapshot(user.id, "WEEKLY", getWeekKey(), { commits: commits.weekly });
  await createSnapshot(user.id, "MONTHLY", getMonthKey(), { commits: commits.monthly });
  await createAllTimeStats(user.id, { commits: commits.allTime, updatedAt: new Date() });
  incomingRequest.headers = await sessionHeadersFor(user.id);
  serveClientSession(user);
  return user;
}

beforeEach(() => {
  incomingRequest.headers = new Headers();
  sessionStorage.clear();
  // Fresh stats skip GitHub; any GraphQL call would be a bug.
  fakeGraphQL({ field: "user", resolve: () => null, intercept: () => new HttpResponse("unexpected", { status: 500 }) });
});

describe("WelcomeFlow", () => {
  test("shows the fetching state first", async () => {
    await signInWithStats({ weekly: 1, monthly: 1, allTime: 1 });
    renderWithRouter(<WelcomeFlow />);
    expect(screen.getByRole("heading", { name: "Fetching your contributions" })).toBeInTheDocument();
  });

  test("shows the member's rank on each board", async () => {
    await signInWithStats({ weekly: 4, monthly: 9, allTime: 120 });
    renderWithRouter(<WelcomeFlow />);

    expect(await screen.findByRole("heading", { name: "You're on the leaderboard" }, AFTER_SYNC)).toBeInTheDocument();
    for (const [label, commits] of [
      ["This week", "4 commits"],
      ["This month", "9 commits"],
      ["All time", "120 commits"],
    ]) {
      const tile = screen.getByText(label).parentElement!;
      expect(within(tile).getByLabelText("Rank 1")).toHaveTextContent("#1");
      expect(tile).toHaveTextContent(commits);
    }
  });

  test("encourages members who aren't on any board yet", async () => {
    await signInWithStats({ weekly: 0, monthly: 0, allTime: 0 });
    renderWithRouter(<WelcomeFlow />);

    expect(await screen.findByRole("heading", { name: "Not on the leaderboard yet" }, AFTER_SYNC)).toBeInTheDocument();
    expect(screen.getAllByLabelText("Not ranked")).toHaveLength(3);
    expect(screen.getByText(/Push to public repos/)).toBeInTheDocument();
  });

  test("offers Omicron next, then sends the member to the leaderboard", async () => {
    const user = userEvent.setup();
    await signInWithStats({ weekly: 1, monthly: 1, allTime: 1 });
    const { router } = renderWithRouter(<WelcomeFlow />);

    await user.click(await screen.findByRole("button", { name: "Continue" }, AFTER_SYNC));

    expect(await screen.findByRole("heading", { name: "Publish your posts here" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Connect Omicron" })).toHaveAttribute(
      "href",
      "/api/omicron/connect?from=welcome",
    );

    await user.click(screen.getByRole("button", { name: "Set up later" }));

    expect(router.push).toHaveBeenCalledWith("/leaderboard");
    expect(sessionStorage.getItem(SCROLL_TO_ME_KEY)).toBe("1");
  });

  test("tells members who already connected Omicron instead of offering it", async () => {
    const user = userEvent.setup();
    const me = await signInWithStats({ weekly: 1, monthly: 1, allTime: 1 });
    await createOmicronConnection(me.id, { username: "ada" });
    const { router } = renderWithRouter(<WelcomeFlow />);

    await user.click(await screen.findByRole("button", { name: "Continue" }, AFTER_SYNC));

    expect(await screen.findByRole("heading", { name: "Omicron is connected" })).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Connect Omicron" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage your posts" })).toHaveAttribute("href", "/account/blog");

    await user.click(screen.getByRole("button", { name: "Go to leaderboard" }));
    expect(router.push).toHaveBeenCalledWith("/leaderboard");
  });

  test("explains a GitHub failure and still continues", async () => {
    const user = userEvent.setup();
    const me = await createUser({ name: "Aysel", githubUsername: "aysel" });
    incomingRequest.headers = await sessionHeadersFor(me.id);
    serveClientSession(me);
    renderWithRouter(<WelcomeFlow />);

    expect(
      await screen.findByRole("heading", { name: "Something went wrong on our side" }, AFTER_SYNC),
    ).toBeInTheDocument();
    expect(screen.getByText(/after the next hourly sync/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "Publish your posts here" })).toBeInTheDocument();
  });

  test("sends signed-out visitors home", async () => {
    serveClientSession(null);
    const { router } = renderWithRouter(<WelcomeFlow />);
    await expect.poll(() => router.replace, AFTER_SYNC).toHaveBeenCalledWith("/");
  });
});
