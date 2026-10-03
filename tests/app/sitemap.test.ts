import { cacheTag } from "next/cache";
import { describe, expect, test } from "vitest";
import sitemap from "@/app/sitemap";
import { createBlogPost, createUser, testPrisma } from "@test/db";

const BASE = "http://localhost:3000";

describe("sitemap", () => {
  test("lists every static page", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual([BASE, `${BASE}/leaderboard`, `${BASE}/showcase`, `${BASE}/api-docs`, `${BASE}/blog`]);
  });

  test("adds each blog post with its last update time", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "first", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createBlogPost(author.id, { slug: "second", createdAt: new Date("2026-02-01T00:00:00Z") });
    const second = await testPrisma.blogPost.findUniqueOrThrow({ where: { slug: "second" } });

    const posts = (await sitemap()).filter((entry) => entry.url.includes("/blog/"));

    expect(posts.map((p) => p.url)).toEqual([`${BASE}/blog/second`, `${BASE}/blog/first`]);
    expect(posts[0]).toEqual({
      url: `${BASE}/blog/second`,
      lastModified: second.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  test("ranks the home page highest", async () => {
    const [home, ...rest] = await sitemap();
    expect(home.priority).toBe(1);
    for (const entry of rest) expect(entry.priority).toBeLessThan(1);
  });

  test("is invalidated with the blog", async () => {
    await sitemap();
    expect(cacheTag).toHaveBeenCalledWith("blog");
  });
});
