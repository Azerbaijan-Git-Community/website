import { describe, expect, test } from "vitest";
import { getBlogPost, getBlogPosts } from "@/data/blog/get";
import { getTableData } from "@/data/leaderboard/get";
import { getShowcaseProjects } from "@/data/showcase/get";
import { BlogListItemSchema, BlogPostSchema, LeaderboardEntrySchema, ShowcaseProjectSchema } from "@/lib/api/schemas";
import { createAllTimeStats, createBlogPost, createShowcaseProject, createUser } from "@test/db";

// Runtime counterpart of the compile-time drift guards: the serialized data-layer output must match the
// published Zod schemas exactly (no missing fields, and no extra fields silently leaking into the API).
const serialize = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe("API schema drift", () => {
  test("leaderboard entries", async () => {
    const user = await createUser();
    await createAllTimeStats(user.id, { commits: 3 });
    const [entry] = (await getTableData()).allTime;
    expect(LeaderboardEntrySchema.parse(serialize(entry))).toEqual(serialize(entry));
  });

  test("blog list items and blog post detail", async () => {
    const user = await createUser();
    await createBlogPost(user.id, { slug: "drift" });

    const [listItem] = await getBlogPosts();
    expect(BlogListItemSchema.parse(serialize(listItem))).toEqual(serialize(listItem));

    const post = await getBlogPost("drift");
    expect(BlogPostSchema.parse(serialize(post))).toEqual(serialize(post));
  });

  test("showcase projects", async () => {
    await createShowcaseProject();
    const [project] = await getShowcaseProjects();
    expect(ShowcaseProjectSchema.parse(serialize(project))).toEqual(serialize(project));
  });
});
