import { HttpResponse } from "msw";
import { updateTag } from "next/cache";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { syncMyStats } from "@/app/welcome/actions";
import { sessionHeadersFor } from "@test/auth";
import { createAllTimeStats, createOmicronConnection, createUser, testPrisma } from "@test/db";
import { fakeGraphQL } from "@test/github";
import { incomingRequest } from "@test/next-headers";

vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

const counts = (commits: number) => ({
  totalCommitContributions: commits,
  totalPullRequestContributions: 0,
  totalIssueContributions: 0,
  totalPullRequestReviewContributions: 0,
});

function fakeGithub(commits: number) {
  return fakeGraphQL({
    field: "user",
    resolve: () => ({
      weekly: counts(commits),
      monthly: counts(commits * 2),
      allTime: { ...counts(commits * 10), contributionCalendar: { totalContributions: commits * 20 } },
      repositories: { totalCount: 1 },
      followers: { totalCount: 1 },
    }),
  });
}

async function signIn(input: Parameters<typeof createUser>[0] = {}) {
  const user = await createUser(input);
  incomingRequest.headers = await sessionHeadersFor(user.id);
  return user;
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-07-15T12:00:00Z"), toFake: ["Date"] });
  vi.spyOn(console, "error").mockImplementation(() => {});
  incomingRequest.headers = new Headers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("syncMyStats", () => {
  test("tells the flow when the visitor isn't signed in", async () => {
    await expect(syncMyStats()).resolves.toEqual({ ok: true, data: { signedIn: false } });
  });

  test("syncs the new member, expires the leaderboard cache and returns their ranks", async () => {
    const me = await signIn({ githubUsername: "aysel" });
    const { queries } = fakeGithub(4);

    await expect(syncMyStats()).resolves.toEqual({
      ok: true,
      data: {
        ranks: {
          weekly: { rank: 1, commits: 4 },
          monthly: { rank: 1, commits: 8 },
          allTime: { rank: 1, commits: 40 },
        },
        omicronUsername: null,
        signedIn: true,
      },
    });
    expect(queries).toHaveLength(1);
    expect(await testPrisma.githubStats.findUnique({ where: { userId: me.id } })).toMatchObject({ commits: 40 });
    expect(updateTag).toHaveBeenCalledWith("leaderboard");
  });

  test("shows members who were already synced their ranks without calling GitHub", async () => {
    const me = await signIn();
    await createAllTimeStats(me.id, { commits: 12, updatedAt: new Date("2026-07-01T11:00:00Z") });
    const { queries } = fakeGithub(4);

    const result = await syncMyStats();

    expect(result).toMatchObject({ ok: true, data: { ranks: { allTime: { rank: 1, commits: 12 } } } });
    expect(queries).toHaveLength(0);
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("reports a failed sync without touching the cache", async () => {
    await signIn();
    fakeGraphQL({ field: "user", resolve: () => null, intercept: () => new HttpResponse("boom", { status: 502 }) });

    await expect(syncMyStats()).resolves.toEqual({
      ok: true,
      data: { signedIn: true, ranks: null, omicronUsername: null },
    });
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("names the member's Omicron account, even if the sync fails", async () => {
    const me = await signIn();
    await createOmicronConnection(me.id, { username: "ada" });
    fakeGraphQL({ field: "user", resolve: () => null, intercept: () => new HttpResponse("boom", { status: 502 }) });

    await expect(syncMyStats()).resolves.toEqual({
      ok: true,
      data: { signedIn: true, ranks: null, omicronUsername: "ada" },
    });
  });

  test("offers Omicron again when the connection was ended there", async () => {
    const me = await signIn();
    await createAllTimeStats(me.id, { commits: 1 });
    await createOmicronConnection(me.id, { subscriptionId: null });

    expect(await syncMyStats()).toMatchObject({ ok: true, data: { omicronUsername: null } });
  });

  test("treats unusable GitHub data like any other failed sync", async () => {
    await signIn();
    fakeGraphQL({ field: "user", resolve: () => "not a user" });

    await expect(syncMyStats()).resolves.toEqual({
      ok: true,
      data: { signedIn: true, ranks: null, omicronUsername: null },
    });
  });
});
