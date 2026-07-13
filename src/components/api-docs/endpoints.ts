// Single source of truth for the Open Data API docs page: drives the endpoint sections,
// the code samples, the interactive runner, and the sidebar table of contents.

export type EndpointParam = {
  name: string;
  example: string;
  description: string;
};

export type EndpointDoc = {
  id: string;
  category: "Stats" | "Leaderboard" | "Blog" | "Showcase";
  method: "GET";
  /** Path template with `{param}` tokens, e.g. `/api/v1/leaderboard/{year}/{month}`. */
  path: string;
  title: string;
  summary: string;
  params?: EndpointParam[];
  /** Short, illustrative example response body. */
  example: string;
};

export const ENDPOINTS: EndpointDoc[] = [
  {
    id: "stats",
    category: "Stats",
    method: "GET",
    path: "/api/v1/stats",
    title: "Community stats",
    summary: "Aggregated community totals, the same numbers shown on the home page hero.",
    example: `{
  "data": {
    "totalCommits": 1284530,
    "totalPullRequests": 41290,
    "totalUsers": 812,
    "lastSyncedAt": "2026-07-13T04:00:00.000Z"
  }
}`,
  },
  {
    id: "leaderboard-current",
    category: "Leaderboard",
    method: "GET",
    path: "/api/v1/leaderboard",
    title: "Current month",
    summary: "Top 100 contributors for the current month, ranked by commits.",
    example: `{
  "data": [
    {
      "userId": "0192f...c7",
      "commits": 342,
      "pullRequests": 21,
      "issues": 7,
      "reviews": 12,
      "user": {
        "githubUsername": "octocat",
        "name": "The Octocat",
        "image": "https://avatars.githubusercontent.com/u/583231",
      }
    }
  ],
  "meta": { "month": "2026-07", "count": 100, "lastSyncedAt": "2026-07-13T04:00:00.000Z" }
}`,
  },
  {
    id: "leaderboard-all-time",
    category: "Leaderboard",
    method: "GET",
    path: "/api/v1/leaderboard/all-time",
    title: "All-time",
    summary:
      "Top 100 contributors by all-time commits. Note: GitHub's contribution window means this reflects roughly the last 12 months (the site labels it “Last Year”).",
    example: `{
  "data": [ /* up to 100 leaderboard entries */ ],
  "meta": { "count": 100, "lastSyncedAt": "2026-07-13T04:00:00.000Z" }
}`,
  },
  {
    id: "leaderboard-month",
    category: "Leaderboard",
    method: "GET",
    path: "/api/v1/leaderboard/{year}/{month}",
    title: "Specific month",
    summary: "Top 100 contributors for a past month. Returns 404 if no data exists for that month.",
    params: [
      { name: "year", example: "2026", description: "Four-digit year (2026–2100)." },
      { name: "month", example: "07", description: "Month number, 1–12 (zero-padding optional)." },
    ],
    example: `{
  "data": [ /* up to 100 leaderboard entries */ ],
  "meta": { "month": "2026-07", "count": 100, "lastSyncedAt": "2026-07-13T04:00:00.000Z" }
}`,
  },
  {
    id: "blog-list",
    category: "Blog",
    method: "GET",
    path: "/api/v1/blog",
    title: "List posts",
    summary: "All blog posts (metadata only, without the MDX body), newest first.",
    example: `{
  "data": [
    {
      "id": "0192f...aa",
      "slug": "hello-world",
      "title": "Hello World",
      "description": "Our first post.",
      "tags": ["community", "news"],
      "coverImage": "https://.../cover.png",
      "userId": "0192f...c7",
      "readingTime": 3,
      "createdAt": "2026-06-01T09:00:00.000Z",
      "author": { "name": "The Octocat", "image": "https://.../583231" }
    }
  ],
  "meta": { "count": 12 }
}`,
  },
  {
    id: "blog-single",
    category: "Blog",
    method: "GET",
    path: "/api/v1/blog/{slug}",
    title: "Single post",
    summary: "A single blog post including its raw MDX body. Returns 404 for an unknown slug.",
    params: [{ name: "slug", example: "hello-world", description: "The post's URL slug." }],
    example: `{
  "data": {
    "id": "0192f...aa",
    "slug": "hello-world",
    "title": "Hello World",
    "description": "Our first post.",
    "tags": ["community"],
    "coverImage": "https://.../cover.png",
    "userId": "0192f...c7",
    "contentMdx": "# Hello\\n\\nWelcome to the community blog...",
    "readingTime": 3,
    "createdAt": "2026-06-01T09:00:00.000Z",
    "updatedAt": "2026-06-02T09:00:00.000Z",
    "author": { "name": "The Octocat", "image": "https://.../583231", "githubUsername": "octocat" }
  }
}`,
  },
  {
    id: "showcase",
    category: "Showcase",
    method: "GET",
    path: "/api/v1/showcase",
    title: "List projects",
    summary: "Community showcase projects with live GitHub repo stats, newest first.",
    example: `{
  "data": [
    {
      "id": "0192f...bb",
      "repo": "Azerbaijan-Git-Community/website",
      "submittedBy": "octocat",
      "banner": null,
      "links": ["https://github.com/Azerbaijan-Git-Community/website"],
      "website": "https://gdg.az",
      "createdAt": "2026-05-01T09:00:00.000Z",
      "stars": 128, "forks": 24, "openIssues": 5, "openPRs": 2,
      "description": "The community website.",
      "homepageUrl": "https://gdg.az",
      "license": "MIT", "language": "TypeScript", "languageColor": "#3178c6",
      "updatedAt": "2026-07-10T09:00:00.000Z"
    }
  ],
  "meta": { "count": 8 }
}`,
  },
];

/** Path without the `/api/v1` prefix, for compact sidebar labels. */
export function shortPath(path: string): string {
  return path.replace("/api/v1", "") || "/";
}

/** Replace `{token}` segments in a path template with encoded values. */
export function fillPath(path: string, values: Record<string, string>): string {
  return path.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(values[key] ?? `{${key}}`));
}

export const KB_SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "base-url", label: "Base URL" },
  { id: "authentication", label: "Authentication" },
  { id: "rate-limits", label: "Rate limits" },
  { id: "caching", label: "Caching" },
  { id: "errors", label: "Errors" },
  { id: "versioning", label: "Versioning" },
  { id: "mcp", label: "MCP server" },
] as const;

export type NavItem = { id: string; label: string };
export type NavGroup = { group: string; items: NavItem[] };

export const DOC_NAV: NavGroup[] = [
  { group: "Guide", items: KB_SECTIONS.map((s) => ({ id: s.id, label: s.label })) },
  { group: "Endpoints", items: ENDPOINTS.map((e) => ({ id: e.id, label: shortPath(e.path) })) },
  { group: "Reference", items: [{ id: "schemas", label: "Schemas & OpenAPI" }] },
];

export const ALL_SECTION_IDS: string[] = [...KB_SECTIONS.map((s) => s.id), ...ENDPOINTS.map((e) => e.id), "schemas"];

/** Displayed verbatim in the "Schemas" section for TypeScript consumers to copy. */
export const ZOD_SCHEMA_SOURCE = `import { z } from "zod";

const DateTime = z.string(); // ISO 8601 date-time

export const LeaderboardUserSchema = z.object({
  githubUsername: z.string(),
  name: z.string(),
  image: z.string(),
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
  totalCommits: z.number().int(),
  totalPullRequests: z.number().int(),
  totalUsers: z.number().int(),
  lastSyncedAt: DateTime.nullable(),
});

export const BlogAuthorSchema = z.object({ name: z.string(), image: z.string() });

export const BlogListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  coverImage: z.string(),
  userId: z.string(),
  readingTime: z.number().int(),
  createdAt: DateTime,
  author: BlogAuthorSchema,
});

export const BlogPostSchema = BlogListItemSchema.extend({
  contentMdx: z.string(),
  updatedAt: DateTime,
  author: BlogAuthorSchema.extend({ githubUsername: z.string() }),
});

export const ShowcaseProjectSchema = z.object({
  id: z.string(),
  repo: z.string(),
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

// Every successful response is wrapped in an envelope:
export const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    meta: z
      .object({
        lastSyncedAt: DateTime.nullable().optional(),
        count: z.number().int().optional(),
        month: z.string().optional(),
      })
      .optional(),
  });`;
