import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "@/app/api/omicron/callback/route";
import { sessionHeadersFor } from "@test/auth";
import { createOmicronConnection, createUser, testPrisma } from "@test/db";
import { server } from "@test/msw";
import { fakeOmicronListing, OMICRON, omicronPost } from "@test/omicron";
import { request } from "@test/request";

let subscribeBody: unknown;

function fakeOmicronAuth(username = "ada") {
  subscribeBody = undefined;
  server.use(
    http.post(`${OMICRON}/oauth/token`, async ({ request: req }) => {
      expect(await req.json()).toMatchObject({
        client_id: "test-omicron-client",
        client_secret: "test-omicron-secret",
        code: "the-code",
        code_verifier: "the-verifier",
      });
      return HttpResponse.json({ access_token: "omi_at_token" });
    }),
    http.get(`${OMICRON}/api/v1/accounts/verify_credentials`, () => HttpResponse.json({ username })),
    http.post(`${OMICRON}/api/webhook-subscriptions`, async ({ request: req }) => {
      subscribeBody = await req.json();
      return HttpResponse.json({ id: "sub-new", url: "x", secret: "whsec_new" }, { status: 201 });
    }),
  );
}

async function callback(userId: string, query = "state=the-state&code=the-code", cookie = "the-state.the-verifier") {
  const headers = await sessionHeadersFor(userId);
  headers.set("cookie", `${headers.get("cookie")}; omicron_oauth=${cookie}`);
  return GET(request(`/api/omicron/callback?${query}`, { headers }));
}

const errorOf = (res: Response) => new URL(res.headers.get("location") ?? "").searchParams.get("error");

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("GET /api/omicron/callback", () => {
  test("links the account, subscribes, imports posts for review, and keeps no tokens", async () => {
    const user = await createUser();
    fakeOmicronAuth();
    fakeOmicronListing("ada", [[omicronPost()]]);

    const res = await callback(user.id);

    expect(res.headers.get("location")).toBe("http://localhost:3000/account/blog");
    expect(res.cookies.get("omicron_oauth")?.value).toBe("");
    expect(subscribeBody).toEqual({ url: "http://localhost:3000/api/webhooks/omicron" });
    const connection = await testPrisma.omicronConnection.findUniqueOrThrow({ where: { userId: user.id } });
    expect(connection).toMatchObject({
      origin: "https://omicron.example",
      username: "ada",
      subscriptionId: "sub-new",
      webhookSecret: "whsec_new",
      reviewedAt: null,
    });
    expect(JSON.stringify(connection)).not.toContain("omi_at_token");
    // Imported, but nothing is live until the member has been through the review.
    const post = await testPrisma.blogPost.findFirstOrThrow();
    expect(post.removedByAuthorAt).toBeInstanceOf(Date);
  });

  test("signed-out visitors go back to the blog", async () => {
    const res = await GET(request("/api/omicron/callback?state=a&code=b"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/blog");
  });

  test.each([
    ["a state that doesn't match", "state=forged&code=the-code", "the-state.the-verifier"],
    ["no state", "code=the-code", "the-state.the-verifier"],
    ["no cookie", "state=the-state&code=the-code", ""],
  ])("%s is refused before anything is exchanged", async (_label, query, cookie) => {
    const user = await createUser();
    expect(errorOf(await callback(user.id, query, cookie))).toBe("expired");
    expect(await testPrisma.omicronConnection.count()).toBe(0);
  });

  test("declining on Omicron's consent page is reported", async () => {
    const user = await createUser();
    expect(errorOf(await callback(user.id, "state=the-state&error=access_denied"))).toBe("denied");
  });

  test("an Omicron account already linked to someone else is refused, with no subscription made", async () => {
    const other = await createUser();
    await createOmicronConnection(other.id, { username: "ada" });
    const user = await createUser();
    fakeOmicronAuth("ada");
    expect(errorOf(await callback(user.id))).toBe("taken");
    expect(subscribeBody).toBeUndefined();
    expect(await testPrisma.omicronConnection.count()).toBe(1);
  });

  test("a blog-banned member can't link a different account", async () => {
    const user = await createUser({ blogBanned: true });
    await createOmicronConnection(user.id, { username: "old" });
    fakeOmicronAuth("new");
    expect(errorOf(await callback(user.id))).toBe("banned");
    const connection = await testPrisma.omicronConnection.findUniqueOrThrow({ where: { userId: user.id } });
    expect(connection.username).toBe("old");
  });

  test("reconnecting replaces the old subscription", async () => {
    const user = await createUser();
    await createOmicronConnection(user.id, { username: "ada", subscriptionId: "sub-old" });
    fakeOmicronAuth("ada");
    fakeOmicronListing("ada", [[]]);
    await callback(user.id);
    const connection = await testPrisma.omicronConnection.findUniqueOrThrow({ where: { userId: user.id } });
    expect(connection.subscriptionId).toBe("sub-new");
  });

  test("a failed exchange is reported and links nothing", async () => {
    const user = await createUser();
    server.use(http.post(`${OMICRON}/oauth/token`, () => HttpResponse.json({ error: "x" }, { status: 400 })));
    expect(errorOf(await callback(user.id))).toBe("failed");
    expect(await testPrisma.omicronConnection.count()).toBe(0);
  });

  test("a failed first import still connects: the daily reconcile catches up", async () => {
    const user = await createUser();
    fakeOmicronAuth();
    fakeOmicronListing("ada", 503);
    const res = await callback(user.id);
    expect(errorOf(res)).toBeNull();
    expect(await testPrisma.omicronConnection.count()).toBe(1);
  });
});
