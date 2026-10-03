import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { authClient } from "@/lib/auth-client";
import { server } from "@test/msw";

describe("authClient", () => {
  test("talks to the app's own auth routes and tags requests with the Sentinel visitor id", async () => {
    let visitorId: string | null = null;
    server.use(
      http.get("http://localhost:3000/api/auth/get-session", ({ request }) => {
        visitorId = request.headers.get("x-visitor-id");
        return HttpResponse.json({
          user: { id: "u1", name: "Aysel", githubUsername: "aysel" },
          session: { id: "s1", userId: "u1" },
        });
      }),
    );

    const { data } = await authClient.getSession();

    expect(data?.user).toMatchObject({ id: "u1", name: "Aysel" });
    expect(visitorId).toBeTruthy();
  });

  test("exposes the admin plugin actions", () => {
    expect(authClient.admin.banUser).toBeTypeOf("function");
    expect(authClient.admin.listUsers).toBeTypeOf("function");
  });
});
