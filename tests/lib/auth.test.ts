import { describe, expect, test } from "vitest";
import { auth } from "@/lib/auth";
import { sessionHeadersFor } from "@test/auth";
import { createUser, testPrisma } from "@test/db";

type GithubProfile = Parameters<NonNullable<typeof auth.options.socialProviders.github.mapProfileToUser>>[0];

function githubProfile(overrides: Partial<GithubProfile> = {}): GithubProfile {
  const profile = {
    id: 42,
    login: "octocat",
    name: "The Octocat",
    email: "octo@example.com",
    avatar_url: "https://avatars.githubusercontent.com/u/42",
  };
  // Only the fields the mapper reads; GitHub's full profile has dozens more.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { ...profile, ...overrides } as GithubProfile;
}

// The admin plugin enforces bans in a session-create hook that only runs inside an endpoint context.
async function startSessionFor(userId: string) {
  const ctx = await auth.$context;
  const admin = auth.options.plugins.find((p) => p.id === "admin")!;
  const hooks = admin.init().options.databaseHooks;
  return hooks.session.create.before(
    { userId, token: "t", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(), id: "s" },
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    { context: ctx } as never,
  );
}

describe("GitHub profile mapping", () => {
  const map = auth.options.socialProviders.github.mapProfileToUser;

  test("maps the GitHub login and id onto the user", () => {
    expect(map(githubProfile())).toEqual({
      name: "The Octocat",
      email: "octo@example.com",
      image: "https://avatars.githubusercontent.com/u/42",
      githubUsername: "octocat",
      githubId: 42,
    });
  });

  test("falls back to the login when the profile has no display name", () => {
    expect(map(githubProfile({ name: "" }))).toMatchObject({ name: "octocat" });
  });

  test("requests only the scopes needed to read the profile", () => {
    expect(auth.options.socialProviders.github.scope).toEqual(["read:user", "user:email"]);
  });
});

describe("sessions", () => {
  test("getSession resolves a signed session cookie to the user", async () => {
    const user = await createUser({ role: "admin", githubUsername: "admin-user" });
    const session = await auth.api.getSession({ headers: await sessionHeadersFor(user.id) });
    expect(session?.user).toMatchObject({ id: user.id, role: "admin", githubUsername: "admin-user" });
  });

  test("sessions last 30 days", async () => {
    const user = await createUser();
    await sessionHeadersFor(user.id);
    const stored = await testPrisma.session.findFirstOrThrow({ where: { userId: user.id } });
    const days = (stored.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
  });

  test("returns null without a session cookie", async () => {
    await expect(auth.api.getSession({ headers: new Headers() })).resolves.toBeNull();
  });

  test("returns null for a forged cookie", async () => {
    const headers = new Headers({ cookie: "better-auth.session_token=forged.signature" });
    await expect(auth.api.getSession({ headers })).resolves.toBeNull();
  });
});

describe("banned users", () => {
  test("cannot start a session, and see the bot-activity message by default", async () => {
    const user = await createUser({ banned: true });
    await expect(startSessionFor(user.id)).rejects.toMatchObject({
      body: {
        code: "BANNED_USER",
        message: "You are banned from the community because of your Bot activity on GitHub.",
      },
    });
  });

  test("see their specific ban reason when one is set", async () => {
    const user = await createUser({ banned: true, banReason: "Spamming pull requests" });
    await expect(startSessionFor(user.id)).rejects.toMatchObject({ body: { message: "Spamming pull requests" } });
  });

  test("non-banned users pass the check", async () => {
    const user = await createUser();
    await expect(startSessionFor(user.id)).resolves.toBeUndefined();
  });
});
