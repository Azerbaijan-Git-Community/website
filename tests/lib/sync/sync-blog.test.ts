import { http, HttpResponse } from "msw";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { syncBlog } from "@/lib/sync/sync-blog";
import { createBlogPost, createUser, testPrisma } from "@test/db";
import { fakeBlogRepo } from "@test/github";
import { server } from "@test/msw";

const RAW = "https://raw.githubusercontent.com/Azerbaijan-Git-Community/blog/main/posts";

function mdx({
  title = "Hello World",
  description = "A first post",
  author = "4242",
  tags = "[react, nextjs]",
  body = "Some content here.",
} = {}) {
  return `---\ntitle: ${title}\ndescription: ${description}\nauthor: ${author}\ntags: ${tags}\n---\n\n${body}\n`;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("syncBlog", () => {
  test("creates new posts from the repo with parsed frontmatter", async () => {
    const author = await createUser({ githubId: 4242 });
    fakeBlogRepo({ "hello-world": { sha: "tree-1", mdx: mdx() } });

    await expect(syncBlog()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, failed: [] });

    const post = await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "hello-world" } });
    expect(post).toMatchObject({
      title: "Hello World",
      description: "A first post",
      tags: ["react", "nextjs"],
      userId: author.id,
      contentMdx: "Some content here.",
      contentSha: "tree-1",
      readingTime: 1,
      coverImage: `${RAW}/hello-world/images/cover.png?sha=img-sha-cover.png`,
    });
  });

  test("busts the post's own cache tag and the list tag", async () => {
    await createUser({ githubId: 4242 });
    fakeBlogRepo({ a: { sha: "1", mdx: mdx() }, b: { sha: "2", mdx: mdx() } });

    await syncBlog();

    expect(vi.mocked(revalidateTag).mock.calls).toEqual(
      expect.arrayContaining([
        ["blog-a", "max"],
        ["blog-b", "max"],
        ["blog", "max"],
      ]),
    );
    expect(revalidateTag).toHaveBeenCalledTimes(3);
  });

  test("skips posts whose tree SHA is unchanged without fetching them", async () => {
    const author = await createUser({ githubId: 4242 });
    await createBlogPost(author.id, { slug: "same", contentSha: "tree-1", title: "Original" });
    const { requests } = fakeBlogRepo({ same: { sha: "tree-1", mdx: mdx({ title: "Changed" }) } });

    await expect(syncBlog()).resolves.toEqual({ synced: 0, skipped: 1, deleted: 0, failed: [] });

    expect(requests).toEqual(["/repos/Azerbaijan-Git-Community/blog/contents/posts"]);
    expect((await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "same" } })).title).toBe("Original");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test("updates a changed post in place, keeping its creation date", async () => {
    const author = await createUser({ githubId: 4242 });
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const existing = await createBlogPost(author.id, { slug: "edited", contentSha: "old", createdAt });
    fakeBlogRepo({ edited: { sha: "new", mdx: mdx({ title: "Edited title" }) } });

    await expect(syncBlog()).resolves.toMatchObject({ synced: 1, skipped: 0 });

    const post = await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "edited" } });
    expect(post).toMatchObject({ id: existing.id, title: "Edited title", contentSha: "new", createdAt });
    expect(await testPrisma.blogPost.count()).toBe(1);
  });

  test("fails a post whose author has not signed up, without creating it", async () => {
    fakeBlogRepo({ orphan: { sha: "1", mdx: mdx({ author: "999" }) } });

    await expect(syncBlog()).resolves.toEqual({ synced: 0, skipped: 0, deleted: 0, failed: ["orphan"] });
    expect(await testPrisma.blogPost.count()).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("no user found with githubId 999"));
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test.for([
    ["has no frontmatter block", "# Just markdown"],
    ["is missing a title", "---\ndescription: d\nauthor: 4242\n---\nbody"],
    ["is missing a description", "---\ntitle: t\nauthor: 4242\n---\nbody"],
    ["is missing an author", "---\ntitle: t\ndescription: d\n---\nbody"],
    ["has a non-numeric author", mdx({ author: "octocat" })],
  ])("fails a post that %s", async ([, source]) => {
    await createUser({ githubId: 4242 });
    fakeBlogRepo({ broken: { sha: "1", mdx: source } });

    await expect(syncBlog()).resolves.toEqual({ synced: 0, skipped: 0, deleted: 0, failed: ["broken"] });
    expect(await testPrisma.blogPost.count()).toBe(0);
  });

  test("fails a post without a cover image", async () => {
    await createUser({ githubId: 4242 });
    fakeBlogRepo({ nocover: { sha: "1", mdx: mdx(), images: ["diagram.png", "cover-old.png"] } });

    await expect(syncBlog()).resolves.toMatchObject({ failed: ["nocover"] });
  });

  test("fails a post without an images folder", async () => {
    await createUser({ githubId: 4242 });
    fakeBlogRepo({ noimages: { sha: "1", mdx: mdx(), images: null } });

    await expect(syncBlog()).resolves.toMatchObject({ failed: ["noimages"] });
  });

  test.for(["cover.jpg", "cover.jpeg", "cover.webp", "cover.svg"])("accepts %s as the cover image", async (name) => {
    await createUser({ githubId: 4242 });
    fakeBlogRepo({ p: { sha: "1", mdx: mdx(), images: ["diagram.png", name] } });

    await syncBlog();

    const post = await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "p" } });
    expect(post.coverImage).toBe(`${RAW}/p/images/${name}?sha=img-sha-${name}`);
  });

  test("a failing post does not block the others, and only synced posts are revalidated", async () => {
    await createUser({ githubId: 4242 });
    fakeBlogRepo({ good: { sha: "1", mdx: mdx() }, bad: { sha: "2", mdx: "no frontmatter" } });

    await expect(syncBlog()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, failed: ["bad"] });
    expect(revalidateTag).toHaveBeenCalledWith("blog-good", "max");
    expect(revalidateTag).not.toHaveBeenCalledWith("blog-bad", "max");
  });

  test("retries a previously failed post on the next run (its SHA was never stored)", async () => {
    fakeBlogRepo({ late: { sha: "1", mdx: mdx() } });
    await expect(syncBlog()).resolves.toMatchObject({ failed: ["late"] });

    await createUser({ githubId: 4242 });
    await expect(syncBlog()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, failed: [] });
  });

  test("ignores loose files in the posts folder", async () => {
    await createUser({ githubId: 4242 });
    fakeBlogRepo({ real: { sha: "1", mdx: mdx() } }, [{ name: "README.md", sha: "r", type: "file" }]);

    await expect(syncBlog()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, failed: [] });
  });

  test("propagates a failure to list the repo", async () => {
    server.use(
      http.get("https://api.github.com/repos/Azerbaijan-Git-Community/blog/contents/posts", () =>
        HttpResponse.text("Bad credentials", { status: 401 }),
      ),
    );
    await expect(syncBlog()).rejects.toMatchObject({ status: 401 });
  });

  describe("frontmatter parsing", () => {
    test("strips quotes and keeps colons inside values", async () => {
      await createUser({ githubId: 4242 });
      fakeBlogRepo({
        q: {
          sha: "1",
          mdx: mdx({ title: '"Next.js: The Good Parts"', description: "'Single quoted'", tags: `["a", 'b', c]` }),
        },
      });

      await syncBlog();

      expect(await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "q" } })).toMatchObject({
        title: "Next.js: The Good Parts",
        description: "Single quoted",
        tags: ["a", "b", "c"],
      });
    });

    test("handles CRLF line endings", async () => {
      await createUser({ githubId: 4242 });
      fakeBlogRepo({ crlf: { sha: "1", mdx: mdx().replaceAll("\n", "\r\n") } });

      await syncBlog();

      expect(await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "crlf" } })).toMatchObject({
        title: "Hello World",
        tags: ["react", "nextjs"],
      });
    });

    test("defaults to no tags when the field is missing or empty", async () => {
      await createUser({ githubId: 4242 });
      fakeBlogRepo({
        notags: { sha: "1", mdx: "---\ntitle: t\ndescription: d\nauthor: 4242\n---\nbody" },
        empty: { sha: "2", mdx: mdx({ tags: "[]" }) },
      });

      await syncBlog();

      const posts = await testPrisma.blogPost.findMany({ select: { tags: true } });
      expect(posts).toEqual([{ tags: [] }, { tags: [] }]);
    });

    test("estimates reading time at 200 words per minute, rounding up", async () => {
      await createUser({ githubId: 4242 });
      fakeBlogRepo({
        long: { sha: "1", mdx: mdx({ body: "word ".repeat(401) }) },
        empty: { sha: "2", mdx: mdx({ body: "" }) },
      });

      await syncBlog();

      const times = Object.fromEntries(
        (await testPrisma.blogPost.findMany()).map((p) => [p.slug, p.readingTime] as const),
      );
      expect(times).toEqual({ long: 3, empty: 1 });
    });

    // Editors on Windows often save UTF-8 with a BOM; fetch decoding must strip it before the frontmatter regex.
    test("accepts a file that starts with a UTF-8 byte order mark", async () => {
      await createUser({ githubId: 4242 });
      fakeBlogRepo({ bom: { sha: "1", mdx: `﻿${mdx()}` } });

      await expect(syncBlog()).resolves.toEqual({ synced: 1, skipped: 0, deleted: 0, failed: [] });
    });
  });

  test("BUG-05: removes posts that were deleted from the blog repo", async () => {
    const author = await createUser({ githubId: 4242 });
    await createBlogPost(author.id, { slug: "kept", contentSha: "1" });
    await createBlogPost(author.id, { slug: "deleted-upstream", contentSha: "2" });
    fakeBlogRepo({ kept: { sha: "1", mdx: mdx() } });

    await expect(syncBlog()).resolves.toEqual({ synced: 0, skipped: 1, deleted: 1, failed: [] });

    const slugs = (await testPrisma.blogPost.findMany({ select: { slug: true } })).map((p) => p.slug);
    expect(slugs).toEqual(["kept"]);
    expect(revalidateTag).toHaveBeenCalledWith("blog-deleted-upstream", "max");
    expect(revalidateTag).toHaveBeenCalledWith("blog", "max");
  });

  test("keeps every post when the listing comes back empty", async () => {
    const author = await createUser({ githubId: 4242 });
    await createBlogPost(author.id, { slug: "kept", contentSha: "1" });
    fakeBlogRepo({});

    await expect(syncBlog()).resolves.toEqual({ synced: 0, skipped: 0, deleted: 0, failed: [] });
    expect(await testPrisma.blogPost.count()).toBe(1);
  });
});
