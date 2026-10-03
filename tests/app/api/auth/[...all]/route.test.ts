import { describe, expect, test } from "vitest";
import { GET, POST } from "@/app/api/auth/[...all]/route";
import { sessionHeadersFor } from "@test/auth";
import { useFakeBetterAuthInfra } from "@test/better-auth-infra";
import { createUser } from "@test/db";
import { request } from "@test/request";

function signInSocial(provider: string, callbackURL = "/") {
  return POST(
    request("/api/auth/sign-in/social", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({ provider, callbackURL }),
    }),
  );
}

describe("/api/auth/[...all]", () => {
  test("get-session returns null for anonymous visitors", async () => {
    const res = await GET(request("/api/auth/get-session"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toBeNull();
  });

  test("get-session returns the signed-in user with the custom GitHub fields", async () => {
    const user = await createUser({ githubUsername: "aysel", githubId: 31337 });
    const res = await GET(request("/api/auth/get-session", { headers: await sessionHeadersFor(user.id) }));

    const body = await res.json();
    expect(body.user).toMatchObject({ id: user.id, githubUsername: "aysel", githubId: 31337, role: "user" });
    expect(body.session.userId).toBe(user.id);
  });

  test("starts the GitHub OAuth flow with the configured client after a security check", async () => {
    const { securityChecks } = useFakeBetterAuthInfra();

    const res = await signInSocial("github", "/leaderboard");

    expect(res.status).toBe(200);
    const { url, redirect } = await res.json();
    expect(redirect).toBe(true);
    const authorize = new URL(url);
    expect(authorize.origin + authorize.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(authorize.searchParams.get("client_id")).toBe("test-client-id");
    expect(authorize.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/callback/github");
    expect(authorize.searchParams.get("state")).toBeTruthy();
    expect(new Set(authorize.searchParams.get("scope")?.split(" "))).toEqual(new Set(["read:user", "user:email"]));
    expect(securityChecks).toEqual([expect.objectContaining({ path: "/sign-in/social" })]);
  });

  test("refuses to start sign-in when Sentinel blocks the request", async () => {
    useFakeBetterAuthInfra({ action: "block", reason: "bot_detected" });

    const res = await signInSocial("github");

    expect(res.status).toBe(403);
  });

  test("rejects providers that are not configured", async () => {
    useFakeBetterAuthInfra();
    const res = await signInSocial("google");
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test("BUG-13: requests each OAuth scope only once", async () => {
    useFakeBetterAuthInfra();
    const { url } = await (await signInSocial("github")).json();
    expect(new URL(url).searchParams.get("scope")).toBe("read:user user:email");
  });
});
