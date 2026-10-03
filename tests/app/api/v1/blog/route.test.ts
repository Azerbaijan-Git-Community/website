import { beforeEach, describe, expect, test } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/blog/route";
import { createBlogPost, createUser } from "@test/db";
import { request } from "@test/request";
import { useFakeUpstash } from "@test/upstash";

beforeEach(() => {
  useFakeUpstash();
});

describe("GET /api/v1/blog", () => {
  test("lists posts newest first without their MDX body", async () => {
    const author = await createUser({ name: "Aysel" });
    await createBlogPost(author.id, { slug: "first", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createBlogPost(author.id, { slug: "second", createdAt: new Date("2026-02-01T00:00:00Z") });

    const res = await GET(request("/api/v1/blog"), undefined);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta).toEqual({ count: 2 });
    expect(body.data.map((p: { slug: string }) => p.slug)).toEqual(["second", "first"]);
    expect(body.data[0]).not.toHaveProperty("contentMdx");
    expect(body.data[0]).toMatchObject({ createdAt: "2026-02-01T00:00:00.000Z", author: { name: "Aysel" } });
  });

  test("returns an empty list when there are no posts", async () => {
    await expect((await GET(request("/api/v1/blog"), undefined)).json()).resolves.toEqual({
      data: [],
      meta: { count: 0 },
    });
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
