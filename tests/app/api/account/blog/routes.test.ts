import { describe, expect, test } from "vitest";
import { PATCH as setVisible } from "@/app/api/account/blog/posts/[id]/route";
import { POST as review } from "@/app/api/account/blog/review/route";
import { DELETE as disconnect, GET as getConnection } from "@/app/api/omicron/connection/route";
import { sessionHeadersFor } from "@test/auth";
import { createBlogPost, createOmicronConnection, createUser, testPrisma } from "@test/db";
import { request, routeContext } from "@test/request";

const json = async (userId: string | null, body: unknown, method = "PATCH") => {
  const headers = userId ? await sessionHeadersFor(userId) : new Headers();
  headers.set("content-type", "application/json");
  return { method, body: JSON.stringify(body), headers };
};
const patch = async (userId: string | null, id: string, body: unknown) =>
  setVisible(request(`/api/account/blog/posts/${id}`, await json(userId, body)), routeContext({ id }));

const sendReview = async (userId: string | null, body: unknown) =>
  review(request("/api/account/blog/review", await json(userId, body, "POST")));
const sendDisconnect = async (userId: string | null) =>
  disconnect(request("/api/omicron/connection", await json(userId, null, "DELETE")));
const rowOf = (id: string) => testPrisma.blogPost.findUniqueOrThrow({ where: { id } });

describe("PATCH /api/account/blog/posts/[id]", () => {
  test("a member can hide and show their own post", async () => {
    const user = await createUser();
    const post = await createBlogPost(user.id);

    expect((await patch(user.id, post.id, { visible: false })).status).toBe(200);
    let row = await testPrisma.blogPost.findUniqueOrThrow({ where: { id: post.id } });
    expect(row.removedByAuthorAt).toBeInstanceOf(Date);

    expect((await patch(user.id, post.id, { visible: true })).status).toBe(200);
    row = await testPrisma.blogPost.findUniqueOrThrow({ where: { id: post.id } });
    expect(row.removedByAuthorAt).toBeNull();
  });

  test("signed-out callers are refused", async () => {
    const post = await createBlogPost((await createUser()).id);
    expect((await patch(null, post.id, { visible: false })).status).toBe(401);
  });

  test("another member's post looks like it doesn't exist", async () => {
    const post = await createBlogPost((await createUser()).id);
    const other = await createUser();
    expect((await patch(other.id, post.id, { visible: false })).status).toBe(404);
  });

  test("an author can't bring back what an admin removed", async () => {
    const user = await createUser();
    const post = await createBlogPost(user.id, { removedByAdminAt: new Date("2026-02-05") });
    expect((await patch(user.id, post.id, { visible: true })).status).toBe(403);
  });

  test("a malformed body is refused", async () => {
    const user = await createUser();
    const post = await createBlogPost(user.id);
    expect((await patch(user.id, post.id, { visible: "yes" })).status).toBe(400);
  });
});

describe("POST /api/account/blog/review", () => {
  const hidden = new Date("2026-02-01");

  test("the ticked posts go live, the others stay hidden, and the review is finished", async () => {
    const user = await createUser();
    await createOmicronConnection(user.id, { reviewedAt: null });
    const [ticked, unticked] = [
      await createBlogPost(user.id, { removedByAuthorAt: hidden }),
      await createBlogPost(user.id, { removedByAuthorAt: hidden }),
    ];

    expect((await sendReview(user.id, { visibleIds: [ticked.id] })).status).toBe(200);

    expect((await rowOf(ticked.id)).removedByAuthorAt).toBeNull();
    expect((await rowOf(unticked.id)).removedByAuthorAt).toEqual(hidden);
    const connection = await testPrisma.omicronConnection.findUniqueOrThrow({ where: { userId: user.id } });
    expect(connection.reviewedAt).toBeInstanceOf(Date);
  });

  test("can't publish someone else's post", async () => {
    const user = await createUser();
    await createOmicronConnection(user.id, { reviewedAt: null });
    const theirs = await createBlogPost((await createUser()).id, { removedByAuthorAt: hidden });
    await sendReview(user.id, { visibleIds: [theirs.id] });
    const row = await testPrisma.blogPost.findUniqueOrThrow({ where: { id: theirs.id } });
    expect(row.removedByAuthorAt).toEqual(hidden);
  });

  test("needs a session and a connection", async () => {
    expect((await sendReview(null, { visibleIds: [] })).status).toBe(401);
    expect((await sendReview((await createUser()).id, { visibleIds: [] })).status).toBe(404);
  });
});

describe("DELETE /api/omicron/connection", () => {
  test("disconnects the member and removes their posts", async () => {
    const user = await createUser();
    await createOmicronConnection(user.id);
    await createBlogPost(user.id);
    expect((await sendDisconnect(user.id)).status).toBe(200);
    expect(await testPrisma.omicronConnection.count()).toBe(0);
    expect(await testPrisma.blogPost.count()).toBe(0);
  });

  test("a blog-banned member can't, which keeps their Omicron account linked", async () => {
    const user = await createUser({ blogBanned: true });
    await createOmicronConnection(user.id);
    expect((await sendDisconnect(user.id)).status).toBe(403);
    expect(await testPrisma.omicronConnection.count()).toBe(1);
  });

  test("signed-out callers are refused", async () => {
    expect((await sendDisconnect(null)).status).toBe(401);
  });
});

const sendGetConnection = async (userId: string | null) =>
  getConnection(
    request("/api/omicron/connection", { headers: userId ? await sessionHeadersFor(userId) : new Headers() }),
  );

describe("GET /api/omicron/connection", () => {
  test("says whether this member is connected, and only this member", async () => {
    const [connected, other] = [await createUser(), await createUser()];
    await createOmicronConnection(connected.id);
    await expect((await sendGetConnection(connected.id)).json()).resolves.toEqual({ connected: true });
    await expect((await sendGetConnection(other.id)).json()).resolves.toEqual({ connected: false });
  });

  test("signed-out callers are refused", async () => {
    expect((await sendGetConnection(null)).status).toBe(401);
  });
});
