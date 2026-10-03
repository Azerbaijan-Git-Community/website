import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/admin/sync/route";
import { POST as blogWebhook } from "@/app/api/webhooks/blog/route";
import { sessionHeadersFor } from "@test/auth";
import { createShowcaseProject, createUser, testPrisma } from "@test/db";
import { fakeBlogRepo, fakeGraphQL } from "@test/github";
import { server } from "@test/msw";
import { incomingRequest } from "@test/next-headers";
import { request } from "@test/request";

vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

function sync(body: unknown) {
  return POST(
    request("/api/admin/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function signInAs(role: "admin" | "user") {
  const user = await createUser({ role });
  incomingRequest.headers = await sessionHeadersFor(user.id);
}

beforeEach(() => {
  incomingRequest.headers = new Headers();
});

describe("POST /api/admin/sync", () => {
  test("is forbidden without a session", async () => {
    const res = await sync({ target: "blog" });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  test("is forbidden for non-admin users", async () => {
    await signInAs("user");
    expect((await sync({ target: "blog" })).status).toBe(403);
  });

  test.for([
    ["an unknown target", { target: "everything" }],
    ["a missing target", {}],
    ["a non-JSON body", "target=blog"],
  ])("rejects %s with 400", async ([, body]) => {
    await signInAs("admin");
    const res = await sync(body);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid sync target" });
  });

  test("refreshes showcase GitHub data in-process", async () => {
    await signInAs("admin");
    await createShowcaseProject({ repo: "acme/rocket", stars: 1 });
    fakeGraphQL({
      field: "repository",
      resolve: () => ({
        stargazerCount: 99,
        forkCount: 0,
        issues: { totalCount: 0 },
        pullRequests: { totalCount: 0 },
        description: null,
        homepageUrl: null,
        licenseInfo: null,
        primaryLanguage: null,
      }),
    });

    const res = await sync({ target: "showcase-data" });

    await expect(res.json()).resolves.toEqual({ message: "Refreshed GitHub data for 1 projects" });
    expect((await testPrisma.showcaseProject.findFirstOrThrow()).stars).toBe(99);
  });

  test("triggers the blog webhook with its secret and relays the result", async () => {
    await signInAs("admin");
    await createUser({ githubId: 77 });
    fakeBlogRepo({ post: { sha: "1", mdx: "---\ntitle: T\ndescription: D\nauthor: 77\n---\nbody" } });
    let forwarded: Request | undefined;
    // Route the outgoing self-call into the real webhook handler.
    server.use(
      http.post("http://localhost:3000/api/webhooks/blog", async ({ request: req }) => {
        forwarded = req.clone();
        return blogWebhook(request("/api/webhooks/blog", { method: "POST", headers: req.headers }));
      }),
    );

    const res = await sync({ target: "blog" });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ message: "Synced 1, skipped 0, failed 0" });
    expect(forwarded?.headers.get("authorization")).toBe("Bearer test-blog-secret");
    expect(await testPrisma.blogPost.count()).toBe(1);
  });

  test.for([
    ["showcase", "/api/webhooks/showcase", "Bearer test-showcase-secret"],
    ["github", "/api/webhooks/leaderboard", "Bearer test-cron-secret"],
  ])("routes the %s target to %s with its own secret", async ([target, path, authorization]) => {
    await signInAs("admin");
    let seen: string | null = null;
    server.use(
      http.post(`http://localhost:3000${path}`, ({ request: req }) => {
        seen = req.headers.get("authorization");
        return HttpResponse.json({ ok: true, message: "done" });
      }),
    );

    const res = await sync({ target });

    await expect(res.json()).resolves.toEqual({ message: "done" });
    expect(seen).toBe(authorization);
  });

  test("relays upstream failures with their status", async () => {
    await signInAs("admin");
    server.use(
      http.post("http://localhost:3000/api/webhooks/leaderboard", () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );

    const res = await sync({ target: "github" });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("tolerates a non-JSON upstream response", async () => {
    await signInAs("admin");
    server.use(
      http.post("http://localhost:3000/api/webhooks/blog", () => new HttpResponse("Gateway Timeout", { status: 504 })),
    );

    const res = await sync({ target: "blog" });

    expect(res.status).toBe(504);
    await expect(res.json()).resolves.toEqual({});
  });
});
