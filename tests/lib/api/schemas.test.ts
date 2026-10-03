import { describe, expect, test } from "vitest";
import {
  ApiErrorSchema,
  BlogListItemSchema,
  BlogPostSchema,
  LeaderboardEntrySchema,
  ShowcaseProjectSchema,
  StatsSchema,
} from "@/lib/api/schemas";

const entry = {
  userId: "u1",
  commits: 10,
  pullRequests: 2,
  issues: 1,
  reviews: 0,
  user: { githubUsername: "octo", name: "Octo", image: "https://example.com/a.png" },
};

describe("API schemas", () => {
  test("accept a leaderboard entry and reject fractional counts", () => {
    expect(LeaderboardEntrySchema.parse(entry)).toEqual(entry);
    expect(LeaderboardEntrySchema.safeParse({ ...entry, commits: 1.5 }).success).toBe(false);
  });

  test("require ISO 8601 date-times", () => {
    const stats = { totalCommits: 1, totalPullRequests: 1, totalUsers: 1 };
    expect(StatsSchema.safeParse({ ...stats, lastSyncedAt: "2026-07-01T10:00:00.000Z" }).success).toBe(true);
    expect(StatsSchema.safeParse({ ...stats, lastSyncedAt: null }).success).toBe(true);
    expect(StatsSchema.safeParse({ ...stats, lastSyncedAt: "July 1st" }).success).toBe(false);
  });

  test("blog post detail extends the list item with body, updatedAt and author username", () => {
    const listItem = {
      id: "p1",
      slug: "hello",
      title: "Hello",
      description: "d",
      tags: [],
      coverImage: "https://example.com/c.png",
      userId: "u1",
      readingTime: 3,
      createdAt: "2026-07-01T10:00:00.000Z",
      author: { name: "Octo", image: "https://example.com/a.png" },
    };
    expect(BlogListItemSchema.safeParse(listItem).success).toBe(true);
    expect(BlogPostSchema.safeParse(listItem).success).toBe(false);
    expect(
      BlogPostSchema.safeParse({
        ...listItem,
        contentMdx: "# Hi",
        updatedAt: listItem.createdAt,
        author: { ...listItem.author, githubUsername: "octo" },
      }).success,
    ).toBe(true);
  });

  test("showcase project allows nullable GitHub metadata", () => {
    const project = {
      id: "s1",
      repo: "a/b",
      submittedBy: "octo",
      banner: null,
      links: [],
      website: null,
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
      stars: 0,
      forks: 0,
      openIssues: 0,
      openPRs: 0,
      description: null,
      homepageUrl: null,
      license: null,
      language: null,
      languageColor: null,
    };
    expect(ShowcaseProjectSchema.parse(project)).toEqual(project);
  });

  test("error envelope", () => {
    expect(ApiErrorSchema.safeParse({ error: { code: "x", message: "y" } }).success).toBe(true);
    expect(ApiErrorSchema.safeParse({ error: "x" }).success).toBe(false);
  });
});
