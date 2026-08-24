import type { CallToolResult } from "@modelcontextprotocol/server";
import { createMcpHandler } from "mcp-handler";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getBlogPost, getBlogPosts } from "@/data/blog/get";
import { getLastSyncTime, getTableData, getTableDataByMonth } from "@/data/leaderboard/get";
import { getShowcaseProjects } from "@/data/showcase/get";
import { getGithubStats } from "@/data/stats/get";
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";
import {
  BlogListItemSchema,
  BlogPostSchema,
  LeaderboardEntrySchema,
  ShowcaseProjectSchema,
  StatsSchema,
} from "@/lib/api/schemas";
import { getMonthKey } from "@/lib/utils.server";

// Public, key-less MCP server exposing the community's open data to AI assistants.
// Tools mirror the REST API under /api/v1 and reuse the same cached data functions.

function jsonResult<S extends z.ZodType>(schema: S, data: z.infer<S>): CallToolResult {
  // For compatibility with older MCP clients, we return both text and structuredContent.
  const text = JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }], structuredContent: z.record(z.string(), z.unknown()).parse(data) };
}

function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/**
 * Wraps a tool handler so an unexpected throw is logged server-side and surfaced to the
 * client as a generic message. Keeps internals (stack traces, DB errors) out of responses
 * and means every tool fails the same way without repeating a try/catch.
 */
function safeHandler<A extends unknown[]>(
  toolName: string,
  run: (...args: A) => Promise<CallToolResult>,
): (...args: A) => Promise<CallToolResult> {
  return async (...args) => {
    try {
      return await run(...args);
    } catch (err) {
      console.error(`[mcp] ${toolName} failed:`, err);
      return errorResult(`${toolName} failed. Please try again.`);
    }
  };
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

const mcpHandler = createMcpHandler(
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
      safeHandler("get_stats", async () => {
        const [stats, lastSync] = await Promise.all([getGithubStats(), getLastSyncTime()]);
        return jsonResult(StatsSchema, {
          totalCommits: stats.totalCommits,
          totalPullRequests: stats.totalPullRequests,
          totalUsers: stats.totalUsers,
          lastSyncedAt: lastSync?.toISOString() ?? null,
        });
      }),
    );

    server.registerTool(
      "get_leaderboard",
      {
        title: "Get monthly leaderboard",
        description:
          "Returns the top 50 contributors (ranked by commits) for a given month. Omit both `year` and `month` for the current month, or provide both to fetch a specific past month. Returns an empty list if that month has no data.",
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
      safeHandler("get_leaderboard", async ({ year, month }: { year?: number; month?: number }) => {
        if ((year === undefined) !== (month === undefined)) {
          return errorResult("Provide both `year` and `month` for a specific month, or neither for the current month.");
        }
        const monthKey =
          year !== undefined && month !== undefined ? `${year}-${String(month).padStart(2, "0")}` : getMonthKey();
        const [entries, lastSync] = await Promise.all([getTableDataByMonth(monthKey), getLastSyncTime()]);
        return jsonResult(leaderboardOutputSchema, {
          month: monthKey,
          count: entries.length,
          lastSyncedAt: lastSync?.toISOString() ?? null,
          entries,
        });
      }),
    );

    server.registerTool(
      "get_all_time_leaderboard",
      {
        title: "Get all-time leaderboard",
        description:
          "Returns the top 50 contributors ranked by commits in the current calendar year. Note: GitHub's contribution window is capped at one year, so this counts the current year only (Jan 1 → Dec 31) and resets every January; the site labels this tab with the year (e.g. '2026').",
        inputSchema: {},
        outputSchema: allTimeOutputSchema,
      },
      safeHandler("get_all_time_leaderboard", async () => {
        const [table, lastSync] = await Promise.all([getTableData(), getLastSyncTime()]);
        return jsonResult(allTimeOutputSchema, {
          count: table.allTime.length,
          lastSyncedAt: lastSync?.toISOString() ?? null,
          entries: table.allTime,
        });
      }),
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
      safeHandler("get_blog_posts", async () => {
        const posts = (await getBlogPosts()).map((post) => ({ ...post, createdAt: post.createdAt.toISOString() }));
        return jsonResult(blogListOutputSchema, { count: posts.length, posts });
      }),
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
      safeHandler("get_blog_post", async ({ slug }: { slug: string }) => {
        const post = await getBlogPost(slug);
        if (!post) return errorResult(`No blog post found with slug "${slug}".`);

        return jsonResult(BlogPostSchema, {
          ...post,
          updatedAt: post.updatedAt.toISOString(),
          createdAt: post.createdAt.toISOString(),
        });
      }),
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
      safeHandler("get_showcase_projects", async () => {
        const projects = (await getShowcaseProjects()).map((p) => ({
          ...p,
          updatedAt: p.updatedAt.toISOString(),
          createdAt: p.createdAt.toISOString(),
        }));
        return jsonResult(showcaseOutputSchema, { count: projects.length, projects });
      }),
    );
  },
  {
    serverInfo: {
      name: "az-git-community-mcp",
      version: "1.0.0",
    },
    verboseLogs: false,
  },
);

// Apply the same per-IP rate limit as the REST API before handing off to the MCP handler.
async function handler(req: Request): Promise<Response> {
  const rl = await checkRateLimit(getClientIp(req));
  if (!rl.ok) {
    return new NextResponse(
      JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Rate limit exceeded" } }),
      { status: 429, headers: { "Content-Type": "application/json", ...rl.headers } },
    );
  }
  return mcpHandler(req);
}

export { handler as GET, handler as POST };
