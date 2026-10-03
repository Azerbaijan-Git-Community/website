import { cacheLife, cacheTag } from "next/cache";
import { describe, expect, test } from "vitest";
import { getAllBlogSlugs, getBlogPost, getBlogPosts } from "@/data/blog/get";
import { createBlogPost, createUser, testPrisma } from "@test/db";

describe("getBlogPosts", () => {
  test("lists posts newest first with their author", async () => {
    const author = await createUser({ name: "Aysel" });
    await createBlogPost(author.id, { slug: "older", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createBlogPost(author.id, { slug: "newer", createdAt: new Date("2026-02-01T00:00:00Z") });

    const posts = await getBlogPosts();

    expect(posts.map((p) => p.slug)).toEqual(["newer", "older"]);
    expect(posts[0].author).toEqual({ name: "Aysel", image: author.image });
  });

  test("omits the MDX body and sync bookkeeping", async () => {
    const author = await createUser();
    await createBlogPost(author.id);

    const [post] = await getBlogPosts();

    expect(Object.keys(post).toSorted()).toEqual(
      [
        "id",
        "slug",
        "title",
        "description",
        "tags",
        "coverImage",
        "userId",
        "readingTime",
        "createdAt",
        "author",
      ].toSorted(),
    );
  });

  test("returns an empty list when there are no posts", async () => {
    await expect(getBlogPosts()).resolves.toEqual([]);
  });

  test("is cached under the blog tag", async () => {
    await getBlogPosts();
    expect(cacheLife).toHaveBeenCalledWith("max");
    expect(cacheTag).toHaveBeenCalledWith("blog");
  });
});

describe("getBlogPost", () => {
  test("returns the full post with author username, without the content SHA", async () => {
    const author = await createUser({ githubUsername: "aysel" });
    await createBlogPost(author.id, { slug: "hello", contentMdx: "# Hello" });

    const post = await getBlogPost("hello");

    expect(post).toMatchObject({
      slug: "hello",
      contentMdx: "# Hello",
      author: { name: author.name, image: author.image, githubUsername: "aysel" },
    });
    expect(post).not.toHaveProperty("contentSha");
    expect(post?.updatedAt).toBeInstanceOf(Date);
  });

  test("returns null for an unknown slug", async () => {
    await expect(getBlogPost("missing")).resolves.toBeNull();
  });

  test("is cached under the post's own tag", async () => {
    await getBlogPost("hello");
    expect(cacheTag).toHaveBeenCalledWith("blog-hello");
  });
});

describe("getAllBlogSlugs", () => {
  test("returns slugs with their last update, newest post first", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "a", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createBlogPost(author.id, { slug: "b", createdAt: new Date("2026-03-01T00:00:00Z") });
    const b = await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "b" } });

    const slugs = await getAllBlogSlugs();

    expect(slugs.map((s) => s.slug)).toEqual(["b", "a"]);
    expect(slugs[0]).toEqual({ slug: "b", updatedAt: b.updatedAt });
  });
});
