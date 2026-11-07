import { revalidateTag } from "next/cache";
import { describe, expect, test } from "vitest";
import { PATCH as moderatePost } from "@/app/api/admin/blog/posts/[id]/route";
import { PATCH as moderateUser } from "@/app/api/admin/blog/users/[id]/route";
import { getBlogPost, getBlogPosts } from "@/data/blog/get";
import { sessionHeadersFor } from "@test/auth";
import { createBlogPost, createUser, testPrisma } from "@test/db";
import { request, routeContext } from "@test/request";

const init = async (userId: string | null, body: unknown) => {
  const headers = userId ? await sessionHeadersFor(userId) : new Headers();
  headers.set("content-type", "application/json");
  return { method: "PATCH", body: JSON.stringify(body), headers };
};
const post = async (userId: string | null, id: string, body: unknown) =>
  moderatePost(request(`/api/admin/blog/posts/${id}`, await init(userId, body)), routeContext({ id }));
const user = async (userId: string | null, id: string, body: unknown) =>
  moderateUser(request(`/api/admin/blog/users/${id}`, await init(userId, body)), routeContext({ id }));
const admin = () => createUser({ role: "admin" });

describe("PATCH /api/admin/blog/posts/[id]", () => {
  test("removes one post and restores it, leaving the author's others alone", async () => {
    const [boss, author] = [await admin(), await createUser()];
    const removed = await createBlogPost(author.id, { slug: "removed" });
    await createBlogPost(author.id, { slug: "kept" });

    expect((await post(boss.id, removed.id, { removed: true })).status).toBe(200);
    expect(await getBlogPost("removed")).toBeNull();
    expect((await getBlogPosts()).map((p) => p.slug)).toEqual(["kept"]);
    expect(revalidateTag).toHaveBeenCalledWith("blog-removed", { expire: 0 });

    expect((await post(boss.id, removed.id, { removed: false })).status).toBe(200);
    expect(await getBlogPost("removed")).not.toBeNull();
  });

  test("only admins may", async () => {
    const author = await createUser();
    const target = await createBlogPost(author.id);
    expect((await post(null, target.id, { removed: true })).status).toBe(403);
    expect((await post(author.id, target.id, { removed: true })).status).toBe(403);
    const row = await testPrisma.blogPost.findUniqueOrThrow({ where: { id: target.id } });
    expect(row.removedByAdminAt).toBeNull();
  });

  test("reports a missing post and a malformed body", async () => {
    const boss = await admin();
    expect((await post(boss.id, "nope", { removed: true })).status).toBe(404);
    const target = await createBlogPost(boss.id);
    expect((await post(boss.id, target.id, { removed: "yes" })).status).toBe(400);
  });
});

describe("PATCH /api/admin/blog/users/[id]", () => {
  test("a blog ban hides every post but leaves the account able to sign in", async () => {
    const [boss, author] = [await admin(), await createUser()];
    await createBlogPost(author.id, { slug: "post" });

    expect((await user(boss.id, author.id, { action: "blog-ban", reason: "Spam" })).status).toBe(200);
    expect(await getBlogPosts()).toEqual([]);
    expect(await testPrisma.user.findUniqueOrThrow({ where: { id: author.id } })).toMatchObject({
      blogBanned: true,
      blogBanReason: "Spam",
      banned: false,
    });

    expect((await user(boss.id, author.id, { action: "blog-unban" })).status).toBe(200);
    expect(await getBlogPosts()).toHaveLength(1);
    expect(await testPrisma.user.findUniqueOrThrow({ where: { id: author.id } })).toMatchObject({
      blogBanned: false,
      blogBanReason: null,
    });
  });

  test("a full ban blocks the account and hides its posts, and unbanning restores both", async () => {
    const [boss, author] = [await admin(), await createUser()];
    await createBlogPost(author.id, { slug: "post" });

    expect((await user(boss.id, author.id, { action: "ban" })).status).toBe(200);
    expect(await testPrisma.user.findUniqueOrThrow({ where: { id: author.id } })).toMatchObject({
      banned: true,
      banReason: "Banned by a community admin.",
    });
    expect(await getBlogPosts()).toEqual([]);
    expect(revalidateTag).toHaveBeenCalledWith("blog", { expire: 0 });

    expect((await user(boss.id, author.id, { action: "unban" })).status).toBe(200);
    expect(await getBlogPosts()).toHaveLength(1);
  });

  test("only admins may, and admins can't be banned here", async () => {
    const [boss, author] = [await admin(), await createUser()];
    expect((await user(null, author.id, { action: "ban" })).status).toBe(403);
    expect((await user(author.id, boss.id, { action: "ban" })).status).toBe(403);
    expect((await user(boss.id, (await admin()).id, { action: "ban" })).status).toBe(403);
    expect((await user(boss.id, "nope", { action: "ban" })).status).toBe(404);
    expect((await user(boss.id, author.id, { action: "explode" })).status).toBe(400);
  });
});
