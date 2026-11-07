import { describe, expect, test } from "vitest";
import { POST } from "@/app/api/webhooks/omicron/route";
import { createBlogPost, createOmicronConnection, createUser, testPrisma } from "@test/db";
import { fakeOmicronPosts, omicronPost, signOmicronBody } from "@test/omicron";
import { request } from "@test/request";

function send(body: string, headers: Record<string, string> = {}) {
  return POST(request("/api/webhooks/omicron", { method: "POST", body, headers }));
}

const event = (overrides: object = {}) =>
  JSON.stringify({ id: "d", event: "post.updated", postId: "post-1", username: "ada", occurredAt: "x", ...overrides });

function signed(body: string, subscription = "sub-a", secret = "whsec_test", at?: number) {
  return send(body, {
    "x-omicron-subscription": subscription,
    "x-omicron-signature": signOmicronBody(secret, body, at),
  });
}

async function connected() {
  const user = await createUser();
  await createOmicronConnection(user.id, { username: "ada", subscriptionId: "sub-a" });
  return user;
}

describe("POST /api/webhooks/omicron", () => {
  test("a genuine event imports the post from Omicron", async () => {
    await connected();
    fakeOmicronPosts({ "post-1": omicronPost() });
    const res = await signed(event());
    expect(res.status).toBe(200);
    expect(await testPrisma.blogPost.count()).toBe(1);
  });

  test("a forged signature is refused and fetches nothing", async () => {
    await connected();
    const res = await signed(event(), "sub-a", "wrong-secret");
    expect(res.status).toBe(401);
    expect(await testPrisma.blogPost.count()).toBe(0);
  });

  test("a missing signature is refused", async () => {
    await connected();
    expect((await send(event(), { "x-omicron-subscription": "sub-a" })).status).toBe(401);
  });

  test("a replayed event is refused", async () => {
    await connected();
    const res = await signed(event(), "sub-a", "whsec_test", Date.now() - 10 * 60_000);
    expect(res.status).toBe(401);
  });

  test("another member's subscription can't sign for this one", async () => {
    await connected();
    const other = await createUser();
    await createOmicronConnection(other.id, { username: "bob", subscriptionId: "sub-b", webhookSecret: "bobs-secret" });
    expect((await signed(event(), "sub-a", "bobs-secret")).status).toBe(401);
  });

  test("an event naming another account is refused, even with a valid signature", async () => {
    await connected();
    expect((await signed(event({ username: "mallory" }))).status).toBe(400);
  });

  test("an unknown subscription gets 410, which tells Omicron to end the connection", async () => {
    expect((await signed(event(), "sub-unknown")).status).toBe(410);
    expect((await send(event())).status).toBe(410);
  });

  test("a body that isn't a valid event is refused", async () => {
    await connected();
    expect((await signed("not json")).status).toBe(400);
    expect((await signed(event({ event: "post.exploded" }))).status).toBe(400);
    expect((await signed(event({ postId: null }))).status).toBe(400);
  });

  test("an oversized body is refused before anything else", async () => {
    expect((await send("x".repeat(17 * 1024))).status).toBe(413);
  });

  test("an Omicron outage answers 502 so the event is retried", async () => {
    await connected();
    fakeOmicronPosts({ "post-1": 503 });
    expect((await signed(event())).status).toBe(502);
  });

  test("a deleted post leaves the blog", async () => {
    const user = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    fakeOmicronPosts({});
    expect((await signed(event({ event: "post.deleted" }))).status).toBe(200);
    const post = await testPrisma.blogPost.findFirstOrThrow();
    expect(post.sourceMissingAt).toBeInstanceOf(Date);
  });

  test("connection.revoked disconnects the member", async () => {
    const user = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    expect((await signed(event({ event: "connection.revoked", postId: null }))).status).toBe(200);
    expect(await testPrisma.omicronConnection.count()).toBe(0);
    expect(await testPrisma.blogPost.count()).toBe(0);
  });
});
