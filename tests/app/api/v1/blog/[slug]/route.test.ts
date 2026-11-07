import { beforeEach, describe, expect, test } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/blog/[slug]/route";
import { createBlogPost, createUser } from "@test/db";
import { request, routeContext } from "@test/request";
import { useFakeUpstash } from "@test/upstash";

function get(slug: string) {
  return GET(request(`/api/v1/blog/${slug}`), routeContext({ slug }));
}

beforeEach(() => {
  useFakeUpstash();
});

describe("GET /api/v1/blog/[slug]", () => {
  test("returns the post with its HTML body and author", async () => {
    const author = await createUser({ githubUsername: "aysel" });
    await createBlogPost(author.id, { slug: "hello", contentHtml: "<h1>Hello</h1>", title: "Hello" });

    const res = await get("hello");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).not.toHaveProperty("meta");
    expect(body.data).toMatchObject({
      slug: "hello",
      title: "Hello",
      contentHtml: "<h1>Hello</h1>",
      author: { githubUsername: "aysel" },
    });
    expect(body.data).not.toHaveProperty("sourcePostId");
  });

  test("returns 404 for an unknown slug", async () => {
    const res = await get("nope");
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: { code: "not_found", message: 'No blog post with slug "nope".' },
    });
  });

  test("a removed post looks like it never existed", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "gone", removedByAdminAt: new Date() });
    expect((await get("gone")).status).toBe(404);
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
