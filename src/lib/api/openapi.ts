import "server-only";
import z from "zod";
import { clientEnv } from "@/lib/env.client";
import {
  ApiErrorSchema,
  BlogListItemSchema,
  BlogPostSchema,
  LeaderboardEntrySchema,
  ShowcaseProjectSchema,
  StatsSchema,
} from "./schemas";

type JsonSchema = Record<string, unknown>;

const toJson = (schema: z.ZodType): JsonSchema => z.toJSONSchema(schema, { target: "draft-2020-12" });

const META_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    lastSyncedAt: { type: ["string", "null"], description: "When GitHub stats were last synced" },
    count: { type: "integer", description: "Number of items in `data`" },
    month: { type: "string", description: "Month key in YYYY-MM form" },
  },
};

const ref = (name: string): JsonSchema => ({ $ref: `#/components/schemas/${name}` });

function envelope(data: JsonSchema): JsonSchema {
  return {
    type: "object",
    properties: { data, meta: META_SCHEMA },
    required: ["data"],
  };
}

function jsonContent(schema: JsonSchema) {
  return { "application/json": { schema } };
}

function errorResponse(description: string) {
  return { description, content: jsonContent(ref("ApiError")) };
}

const okResponses = {
  "429": errorResponse("Rate limit exceeded (20/min or 500/day per IP)."),
  "500": errorResponse("Internal server error."),
};

/** Build the OpenAPI 3.1 document for the Open Data API. */
export function buildOpenApiDocument(): JsonSchema {
  const baseUrl = clientEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");

  return {
    openapi: "3.1.0",
    info: {
      title: "Azerbaijan GitHub Community — Open Data API",
      version: "1.0.0",
      description:
        "Public, key-less, read-only access to community data: contribution stats, leaderboard, blog posts, and showcase projects. Rate limited per IP (20/min, 500/day).",
    },
    servers: [{ url: `${baseUrl}/api/v1`, description: "Production" }],
    paths: {
      "/stats": {
        get: {
          operationId: "getStats",
          summary: "Community contribution totals",
          tags: ["Stats"],
          responses: {
            "200": { description: "Aggregated community stats.", content: jsonContent(envelope(ref("Stats"))) },
            ...okResponses,
          },
        },
      },
      "/leaderboard": {
        get: {
          operationId: "getCurrentLeaderboard",
          summary: "Current month leaderboard (top 50 by commits)",
          tags: ["Leaderboard"],
          responses: {
            "200": {
              description: "Top 50 contributors for the current month.",
              content: jsonContent(envelope({ type: "array", items: ref("LeaderboardEntry") })),
            },
            ...okResponses,
          },
        },
      },
      "/leaderboard/all-time": {
        get: {
          operationId: "getAllTimeLeaderboard",
          summary: "All-time leaderboard (top 50 by commits)",
          description:
            "Top 50 contributors by all-time commit count. Note: GitHub's contribution window means this reflects roughly the last 12 months (the site labels this 'Last Year').",
          tags: ["Leaderboard"],
          responses: {
            "200": {
              description: "Top 50 all-time contributors.",
              content: jsonContent(envelope({ type: "array", items: ref("LeaderboardEntry") })),
            },
            ...okResponses,
          },
        },
      },
      "/leaderboard/{year}/{month}": {
        get: {
          operationId: "getMonthlyLeaderboard",
          summary: "Historical month leaderboard (top 50 by commits)",
          tags: ["Leaderboard"],
          parameters: [
            { name: "year", in: "path", required: true, schema: { type: "integer", example: 2026 } },
            {
              name: "month",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1, maximum: 12, example: 7 },
            },
          ],
          responses: {
            "200": {
              description: "Top 50 contributors for the requested month.",
              content: jsonContent(envelope({ type: "array", items: ref("LeaderboardEntry") })),
            },
            "400": errorResponse("Invalid year or month."),
            "404": errorResponse("No leaderboard data for that month."),
            ...okResponses,
          },
        },
      },
      "/blog": {
        get: {
          operationId: "getBlogPosts",
          summary: "List blog posts (without body)",
          tags: ["Blog"],
          responses: {
            "200": {
              description: "All blog posts, newest first.",
              content: jsonContent(envelope({ type: "array", items: ref("BlogListItem") })),
            },
            ...okResponses,
          },
        },
      },
      "/blog/{slug}": {
        get: {
          operationId: "getBlogPost",
          summary: "Single blog post (with MDX body)",
          tags: ["Blog"],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "The blog post.", content: jsonContent(envelope(ref("BlogPost"))) },
            "404": errorResponse("No post with that slug."),
            ...okResponses,
          },
        },
      },
      "/showcase": {
        get: {
          operationId: "getShowcaseProjects",
          summary: "List showcase projects",
          tags: ["Showcase"],
          responses: {
            "200": {
              description: "All showcase projects, newest first.",
              content: jsonContent(envelope({ type: "array", items: ref("ShowcaseProject") })),
            },
            ...okResponses,
          },
        },
      },
    },
    components: {
      schemas: {
        Stats: toJson(StatsSchema),
        LeaderboardEntry: toJson(LeaderboardEntrySchema),
        BlogListItem: toJson(BlogListItemSchema),
        BlogPost: toJson(BlogPostSchema),
        ShowcaseProject: toJson(ShowcaseProjectSchema),
        ApiError: toJson(ApiErrorSchema),
      },
    },
  };
}
