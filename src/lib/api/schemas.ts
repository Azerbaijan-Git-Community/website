import z from "zod";

// Zod schemas describing the JSON shapes returned by the Open Data API.
// These mirror the database columns (dates are serialized to ISO 8601 strings in JSON).
// They are the single source of truth for the generated OpenAPI document and the docs page.

const DateTime = z.string().describe("ISO 8601 date-time");

export const LeaderboardUserSchema = z.object({
  githubUsername: z.string(),
  name: z.string(),
  image: z.string(),
  createdAt: DateTime.describe("When the user joined the community"),
});

export const LeaderboardEntrySchema = z.object({
  userId: z.string(),
  commits: z.number().int(),
  pullRequests: z.number().int(),
  issues: z.number().int(),
  reviews: z.number().int(),
  user: LeaderboardUserSchema,
});

export const StatsSchema = z.object({
  totalCommits: z.number().int().describe("Community-wide commit total (home page hero number)"),
  totalPullRequests: z.number().int(),
  totalUsers: z.number().int(),
  lastSyncedAt: DateTime.nullable().describe("When GitHub stats were last synced"),
});

const BlogAuthorSchema = z.object({
  name: z.string(),
  image: z.string(),
});

export const BlogListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  coverImage: z.string(),
  userId: z.string(),
  readingTime: z.number().int().describe("Estimated reading time in minutes"),
  createdAt: DateTime,
  author: BlogAuthorSchema,
});

export const BlogPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  coverImage: z.string(),
  userId: z.string(),
  contentMdx: z.string().describe("Raw MDX body of the post"),
  readingTime: z.number().int(),
  createdAt: DateTime,
  updatedAt: DateTime,
  author: BlogAuthorSchema.extend({ githubUsername: z.string() }),
});

export const ShowcaseProjectSchema = z.object({
  id: z.string(),
  repo: z.string().describe("owner/name of the GitHub repository"),
  submittedBy: z.string(),
  banner: z.string().nullable(),
  links: z.array(z.string()),
  website: z.string().nullable(),
  createdAt: DateTime,
  stars: z.number().int(),
  forks: z.number().int(),
  openIssues: z.number().int(),
  openPRs: z.number().int(),
  description: z.string().nullable(),
  homepageUrl: z.string().nullable(),
  license: z.string().nullable(),
  language: z.string().nullable(),
  languageColor: z.string().nullable(),
  updatedAt: DateTime,
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type LeaderboardEntryDto = z.infer<typeof LeaderboardEntrySchema>;
export type StatsDto = z.infer<typeof StatsSchema>;
export type BlogListItemDto = z.infer<typeof BlogListItemSchema>;
export type BlogPostDto = z.infer<typeof BlogPostSchema>;
export type ShowcaseProjectDto = z.infer<typeof ShowcaseProjectSchema>;
