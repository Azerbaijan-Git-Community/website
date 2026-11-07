import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { disconnectOmicron, reconcileAccount, reconcileAllAccounts, syncPost } from "@/lib/sync/sync-omicron";
import { createBlogPost, createOmicronConnection, createUser, testPrisma } from "@test/db";
import { fakeOmicronListing, fakeOmicronPosts, omicronPost } from "@test/omicron";

async function connected(reviewedAt: Date | null = new Date("2026-01-01T00:00:00Z")) {
  const user = await createUser();
  const connection = await createOmicronConnection(user.id, { username: "ada", reviewedAt });
  return { user, connection };
}
const stored = (sourcePostId = "post-1") =>
  testPrisma.blogPost.findUnique({
    where: { sourceOrigin_sourcePostId: { sourceOrigin: "https://omicron.example", sourcePostId } },
  });

describe("syncPost", () => {
  test("imports a post with the fields the blog needs", async () => {
    const { user, connection } = await connected();
    fakeOmicronPosts({
      "post-1": omicronPost({
        contentHtml: '<p>Hello <img src="/api/uploads/a.png"></p><script>alert(1)</script>',
        aiAssisted: true,
      }),
    });

    await syncPost(connection, "post-1");

    expect(await stored()).toMatchObject({
      slug: "ada-hello",
      title: "Hello",
      description: "A greeting",
      tags: ["Go"],
      coverImage: "https://omicron.example/api/uploads/cover.png",
      userId: user.id,
      sourceUrl: "https://omicron.example/@ada/hello",
      aiAssisted: true,
      readingTime: 1,
      removedByAuthorAt: null,
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    });
    const { contentHtml } = (await stored())!;
    expect(contentHtml).toContain("https://omicron.example/api/uploads/a.png");
    expect(contentHtml).not.toContain("script");
    expect(revalidateTag).toHaveBeenCalledWith("blog", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("blog-ada-hello", { expire: 0 });
  });

  test("before the review, a new post is imported hidden", async () => {
    const { connection } = await connected(null);
    fakeOmicronPosts({ "post-1": omicronPost() });
    await syncPost(connection, "post-1");
    expect((await stored())?.removedByAuthorAt).toBeInstanceOf(Date);
  });

  test("fills in what Omicron may leave empty", async () => {
    const { connection } = await connected();
    fakeOmicronPosts({
      "post-1": omicronPost({ summary: null, bannerUrl: null, contentHtml: `<p>${"word ".repeat(600)}</p>` }),
    });
    await syncPost(connection, "post-1");
    const post = await stored();
    expect(post?.description.length).toBeLessThanOrEqual(160);
    expect(post?.description).toContain("word");
    expect(post?.coverImage).toBe("http://localhost:3000/azgit_1024_white.png");
    expect(post?.readingTime).toBe(3);
  });

  test("won't use a cover that isn't HTTPS", async () => {
    const { connection } = await connected();
    fakeOmicronPosts({ "post-1": omicronPost({ bannerUrl: "http://insecure.example/a.png" }) });
    await syncPost(connection, "post-1");
    expect((await stored())?.coverImage).toBe("http://localhost:3000/azgit_1024_white.png");
  });

  test("an edit updates the post but keeps its URL, even if Omicron's slug changed", async () => {
    const { connection } = await connected();
    fakeOmicronPosts({ "post-1": omicronPost() });
    await syncPost(connection, "post-1");
    fakeOmicronPosts({
      "post-1": omicronPost({ title: "Renamed", slug: "renamed", updatedAt: "2026-02-02T00:00:00.000Z" }),
    });
    await syncPost(connection, "post-1");
    expect(await stored()).toMatchObject({
      title: "Renamed",
      slug: "ada-hello",
      sourceUrl: "https://omicron.example/@ada/renamed",
    });
  });

  test("an unchanged post isn't rewritten", async () => {
    const { connection } = await connected();
    fakeOmicronPosts({ "post-1": omicronPost() });
    await syncPost(connection, "post-1");
    vi.mocked(revalidateTag).mockClear();
    await syncPost(connection, "post-1");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test.each([
    ["author", "removedByAuthorAt"],
    ["admin", "removedByAdminAt"],
  ] as const)("an edit never brings back a post hidden by the %s", async (_who, field) => {
    const { user, connection } = await connected();
    const removedAt = new Date("2026-02-05");
    await createBlogPost(user.id, { sourcePostId: "post-1", [field]: removedAt });
    fakeOmicronPosts({ "post-1": omicronPost({ updatedAt: "2026-03-01T00:00:00.000Z" }) });
    await syncPost(connection, "post-1");
    const post = await stored();
    expect(post?.title).toBe("Hello");
    expect(post?.[field]).toEqual(removedAt);
  });

  test("a colliding slug gets the post id added, instead of failing", async () => {
    const { user, connection } = await connected();
    await createBlogPost(user.id, { slug: "ada-hello" });
    fakeOmicronPosts({ "post-1": omicronPost() });
    await syncPost(connection, "post-1");
    expect((await stored())?.slug).toBe("ada-hello-post-1");
  });

  test.each([
    ["a 404", undefined],
    ["a draft", omicronPost({ status: "draft" })],
    ["someone else's post", omicronPost({ author: { username: "mallory" } })],
    ["a federated copy", omicronPost({ remote: true })],
    ["an untitled post", omicronPost({ title: null })],
  ])("%s marks a stored post missing and imports nothing new", async (_label, response) => {
    const { user, connection } = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    fakeOmicronPosts(response ? { "post-1": response } : {});
    await syncPost(connection, "post-1");
    expect((await stored())?.sourceMissingAt).toBeInstanceOf(Date);

    fakeOmicronPosts(response ? { "post-2": response } : {});
    await syncPost(connection, "post-2");
    expect(await stored("post-2")).toBeNull();
  });

  test("a post that comes back is shown again", async () => {
    const { user, connection } = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1", sourceMissingAt: new Date("2026-02-05") });
    fakeOmicronPosts({ "post-1": omicronPost() });
    await syncPost(connection, "post-1");
    expect((await stored())?.sourceMissingAt).toBeNull();
  });

  test("an Omicron outage changes nothing and throws, so the event is retried", async () => {
    const { user, connection } = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    fakeOmicronPosts({ "post-1": 503 });
    await expect(syncPost(connection, "post-1")).rejects.toThrow("503");
    expect((await stored())?.sourceMissingAt).toBeNull();
  });
});

describe("reconcileAccount", () => {
  test("imports across pages and records the sync", async () => {
    const { connection } = await connected();
    fakeOmicronListing("ada", [[omicronPost()], [omicronPost({ id: "post-2", slug: "second" })]]);
    await reconcileAccount(connection);
    expect(await testPrisma.blogPost.count()).toBe(2);
    const updated = await testPrisma.omicronConnection.findUniqueOrThrow({ where: { id: connection.id } });
    expect(updated.lastSyncedAt).toBeInstanceOf(Date);
  });

  test("a post gone from the listing is marked missing: this is how a suspended or private author is noticed", async () => {
    const { user, connection } = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    fakeOmicronListing("ada", [[]]);
    await reconcileAccount(connection);
    expect((await stored())?.sourceMissingAt).toBeInstanceOf(Date);
  });

  test("a deleted account (404) marks everything missing", async () => {
    const { user, connection } = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    fakeOmicronListing("ada", 404);
    await reconcileAccount(connection);
    expect((await stored())?.sourceMissingAt).toBeInstanceOf(Date);
  });

  test("an Omicron outage changes nothing", async () => {
    const { user, connection } = await connected();
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    fakeOmicronListing("ada", 503);
    await expect(reconcileAccount(connection)).rejects.toThrow("503");
    expect((await stored())?.sourceMissingAt).toBeNull();
  });

  test("one account failing doesn't stop the others, and dead connections are skipped", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const [a, b, c] = [await createUser(), await createUser(), await createUser()];
    await createOmicronConnection(a.id, { username: "ada" });
    await createOmicronConnection(b.id, { username: "bob" });
    await createOmicronConnection(c.id, { username: "dead", subscriptionId: null });
    fakeOmicronListing("ada", 503);
    fakeOmicronListing("bob", [[omicronPost({ author: { username: "bob" } })]]);
    await expect(reconcileAllAccounts()).resolves.toEqual({ synced: 1, failed: ["ada"] });
  });
});

describe("disconnectOmicron", () => {
  test("removes the link and the posts, but keeps admin-removed rows so reconnecting can't restore them", async () => {
    const { user } = await connected();
    await createBlogPost(user.id, { sourcePostId: "kept", removedByAdminAt: new Date("2026-02-05") });
    await createBlogPost(user.id, { sourcePostId: "gone" });
    await disconnectOmicron(user.id);
    expect(await testPrisma.omicronConnection.count()).toBe(0);
    expect((await testPrisma.blogPost.findMany()).map((post) => post.sourcePostId)).toEqual(["kept"]);
  });

  test("a banned member keeps the link but stops receiving, so the account can't move to another login", async () => {
    const user = await createUser({ blogBanned: true });
    await createOmicronConnection(user.id, { username: "ada" });
    await createBlogPost(user.id, { sourcePostId: "post-1" });
    await disconnectOmicron(user.id);
    const connection = await testPrisma.omicronConnection.findUniqueOrThrow({ where: { userId: user.id } });
    expect(connection).toMatchObject({ username: "ada", subscriptionId: null, webhookSecret: null });
    expect(await testPrisma.blogPost.count()).toBe(1);
  });
});
