import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getBlogPost, getBlogPosts } from "@/data/blog/get";
import { getLastSyncTime, getTableData } from "@/data/leaderboard/get";
import { getShowcaseProjects } from "@/data/showcase/get";
import { getGithubStats } from "@/data/stats/get";
import {
  BlogListItemSchema,
  BlogPostSchema,
  LeaderboardEntrySchema,
  ShowcaseProjectSchema,
  StatsSchema,
} from "@/lib/api/schemas";
import { getMonthKey } from "@/lib/utils.server";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

// Public, key-less MCP server exposing the community's open data to AI assistants.
// Tools mirror the REST API under /api/v1 and reuse the same cached data functions.

function jsonResult<S extends z.ZodType>(schema: S, data: z.infer<S>): CallToolResult {
  // For compatibility with older MCP clients, we return both text and structuredContent.
  const text = JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }], structuredContent: data as Record<string, unknown> };
}

function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

const leaderboardOutputSchema = z.object({
  month: z.string(),
  count: z.number().int(),
  lastSyncedAt: z.string().nullable(),
  entries: z.array(LeaderboardEntrySchema),
});

const allTimeOutputSchema = z.object({
  count: z.number().int(),
  lastSyncedAt: z.string().nullable(),
  entries: z.array(LeaderboardEntrySchema),
});

const blogListOutputSchema = z.object({
  count: z.number().int(),
  posts: z.array(BlogListItemSchema),
});

const showcaseOutputSchema = z.object({
  count: z.number().int(),
  projects: z.array(ShowcaseProjectSchema),
});

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "get_stats",
      {
        title: "Get community stats",
        description:
          "Returns aggregated community totals: total commits, total pull requests, number of users, and when the stats were last synced. These are the numbers shown on the site's home page hero.",
        inputSchema: {},
        outputSchema: StatsSchema,
      },
      async () => {
        try {
          const [stats, lastSync] = await Promise.all([getGithubStats(), getLastSyncTime()]);
          return jsonResult(StatsSchema, {
            totalCommits: stats.totalCommits,
            totalPullRequests: stats.totalPullRequests,
            totalUsers: stats.totalUsers,
            lastSyncedAt: lastSync ? lastSync.toISOString() : null,
          });
        } catch (err) {
          console.error("[mcp] get_stats failed:", err);
          return errorResult("Failed to fetch community stats. Please try again.");
        }
      },
    );

    server.registerTool(
      "get_leaderboard",
      {
        title: "Get monthly leaderboard",
        description:
          "Returns the top 100 contributors (ranked by commits) for a given month. Omit both `year` and `month` for the current month, or provide both to fetch a specific past month. Returns an empty list if that month has no data.",
        inputSchema: {
          year: z
            .number()
            .int()
            .min(2026)
            .max(2100)
            .optional()
            .describe("Four-digit year. Provide together with `month`."),
          month: z
            .number()
            .int()
            .min(1)
            .max(12)
            .optional()
            .describe("Month number 1-12. Provide together with `year`."),
        },
        outputSchema: leaderboardOutputSchema,
      },
      async ({ year, month }) => {
        if ((year === undefined) !== (month === undefined)) {
          return errorResult("Provide both `year` and `month` for a specific month, or neither for the current month.");
        }
        try {
          const [table, lastSync] = await Promise.all([getTableData(), getLastSyncTime()]);
          const monthKey =
            year !== undefined && month !== undefined ? `${year}-${String(month).padStart(2, "0")}` : getMonthKey();
          const entries = table.monthly[monthKey] ?? [];
          return jsonResult(leaderboardOutputSchema, {
            month: monthKey,
            count: entries.length,
            lastSyncedAt: lastSync ? lastSync.toISOString() : null,
            entries,
          });
        } catch (err) {
          console.error("[mcp] get_leaderboard failed:", err);
          return errorResult("Failed to fetch the leaderboard. Please try again.");
        }
      },
    );

    server.registerTool(
      "get_all_time_leaderboard",
      {
        title: "Get all-time leaderboard",
        description:
          "Returns the top 100 contributors ranked by all-time commits. Note: GitHub's contribution window means this reflects roughly the last 12 months (the site labels it 'Last Year').",
        inputSchema: {},
        outputSchema: allTimeOutputSchema,
      },
      async () => {
        try {
          const [table, lastSync] = await Promise.all([getTableData(), getLastSyncTime()]);
          return jsonResult(allTimeOutputSchema, {
            count: table.allTime.length,
            lastSyncedAt: lastSync ? lastSync.toISOString() : null,
            entries: table.allTime,
          });
        } catch (err) {
          console.error("[mcp] get_all_time_leaderboard failed:", err);
          return errorResult("Failed to fetch the all-time leaderboard. Please try again.");
        }
      },
    );

    server.registerTool(
      "get_blog_posts",
      {
        title: "List blog posts",
        description:
          "Returns all community blog posts (metadata only, without the MDX body), newest first. Use `get_blog_post` with a slug to read a full post.",
        inputSchema: {},
        outputSchema: blogListOutputSchema,
      },
      async () => {
        try {
          const posts = (await getBlogPosts()).map((post) => ({ ...post, createdAt: post.createdAt.toISOString() }));
          return jsonResult(blogListOutputSchema, { count: posts.length, posts });
        } catch (err) {
          console.error("[mcp] get_blog_posts failed:", err);
          return errorResult("Failed to fetch blog posts. Please try again.");
        }
      },
    );

    server.registerTool(
      "get_blog_post",
      {
        title: "Get a blog post",
        description: "Returns a single blog post including its raw MDX body, by slug (as returned by get_blog_posts).",
        inputSchema: {
          slug: z.string().min(1).describe("The post's URL slug."),
        },
        outputSchema: BlogPostSchema,
      },
      async ({ slug }) => {
        try {
          const post = await getBlogPost(slug);
          if (!post) return errorResult(`No blog post found with slug "${slug}".`);

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { contentSha, ...result } = post;
          return jsonResult(BlogPostSchema, {
            ...result,
            updatedAt: result.updatedAt.toISOString(),
            createdAt: result.createdAt.toISOString(),
          });
        } catch (err) {
          console.error("[mcp] get_blog_post failed:", err);
          return errorResult("Failed to fetch the blog post. Please try again.");
        }
      },
    );

    server.registerTool(
      "get_showcase_projects",
      {
        title: "List showcase projects",
        description:
          "Returns the community's showcase projects with live GitHub repo stats (stars, forks, etc.), newest first.",
        inputSchema: {},
        outputSchema: showcaseOutputSchema,
      },
      async () => {
        try {
          const projects = await getShowcaseProjects();
          // Mirror the DB rows but drop the sync-bookkeeping `fileSha`.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const data = projects.map(({ fileSha, updatedAt, createdAt, ...p }) => ({
            ...p,
            updatedAt: updatedAt.toISOString(),
            createdAt: createdAt.toISOString(),
          }));
          return jsonResult(showcaseOutputSchema, { count: data.length, projects: data });
        } catch (err) {
          console.error("[mcp] get_showcase_projects failed:", err);
          return errorResult("Failed to fetch showcase projects. Please try again.");
        }
      },
    );
  },
  {
    serverInfo: {
      name: "az-git-community-mcp",
      version: "1.0.0",
    },
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: false,
  },
);

export { handler as GET, handler as POST };
