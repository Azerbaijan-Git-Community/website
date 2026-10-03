import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "@/app/api/mcp/[transport]/route";
import { createAllTimeStats, createBlogPost, createShowcaseProject, createSnapshot, createUser } from "@test/db";
import { upstash, useFakeUpstash } from "@test/upstash";

type ToolResult = {
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

let nextId = 1;

/** Send one JSON-RPC message over Streamable HTTP and decode the (JSON or SSE) reply. */
async function rpc(method: string, params: Record<string, unknown> = {}, ip = "192.0.2.1") {
  const res = await POST(
    new Request("http://localhost:3000/api/mcp/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    }),
  );
  const text = await res.text();
  const json = text.startsWith("{")
    ? text
    : text
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6))
        .join("");
  return { res, body: JSON.parse(json) };
}

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  const { body } = await rpc("tools/call", { name, arguments: args });
  return body.result;
}

beforeEach(() => {
  useFakeUpstash();
  vi.useFakeTimers({ now: new Date("2026-07-15T12:00:00Z"), toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MCP server", () => {
  test("lists the six open-data tools with input and output schemas", async () => {
    const { res, body } = await rpc("tools/list");

    expect(res.status).toBe(200);
    const tools: { name: string; inputSchema: object; outputSchema: object }[] = body.result.tools;
    expect(tools.map((t) => t.name)).toEqual([
      "get_stats",
      "get_leaderboard",
      "get_all_time_leaderboard",
      "get_blog_posts",
      "get_blog_post",
      "get_showcase_projects",
    ]);
    for (const tool of tools) {
      expect(tool.inputSchema).toMatchObject({ type: "object" });
      expect(tool.outputSchema).toMatchObject({ type: "object" });
    }
  });

  test("get_stats returns totals as both text and structured content", async () => {
    const user = await createUser();
    await createAllTimeStats(user.id, { commits: 30, pullRequests: 4, updatedAt: new Date("2026-07-15T11:00:00Z") });

    const result = await callTool("get_stats");

    const expected = {
      totalCommits: 30,
      totalPullRequests: 4,
      totalUsers: 1,
      lastSyncedAt: "2026-07-15T11:00:00.000Z",
    };
    expect(result.structuredContent).toEqual(expected);
    expect(JSON.parse(result.content[0].text)).toEqual(expected);
    expect(result.isError).toBeUndefined();
  });

  describe("get_leaderboard", () => {
    test("defaults to the current month", async () => {
      const user = await createUser({ githubUsername: "aysel" });
      await createSnapshot(user.id, "MONTHLY", "2026-07", { commits: 9 });

      const result = await callTool("get_leaderboard");

      expect(result.structuredContent).toMatchObject({
        month: "2026-07",
        count: 1,
        lastSyncedAt: null,
        entries: [{ commits: 9, user: { githubUsername: "aysel" } }],
      });
    });

    test("fetches a specific month, zero-padding it", async () => {
      const user = await createUser();
      await createSnapshot(user.id, "MONTHLY", "2026-03", { commits: 2 });

      const result = await callTool("get_leaderboard", { year: 2026, month: 3 });

      expect(result.structuredContent).toMatchObject({ month: "2026-03", count: 1 });
    });

    test("returns an empty list for a month without data", async () => {
      const result = await callTool("get_leaderboard", { year: 2027, month: 1 });
      expect(result.structuredContent).toMatchObject({ month: "2027-01", count: 0, entries: [] });
    });

    test.for([{ year: 2026 }, { month: 5 }])("errors when only one of year/month is given: %o", async (args) => {
      const result = await callTool("get_leaderboard", args);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe(
        "Provide both `year` and `month` for a specific month, or neither for the current month.",
      );
    });

    test.for([
      { year: 2025, month: 1 },
      { year: 2026, month: 13 },
    ])("rejects out-of-range input %o", async (args) => {
      const result = await callTool("get_leaderboard", args);
      expect(result.isError).toBe(true);
    });
  });

  test("get_all_time_leaderboard returns the all-time table", async () => {
    const user = await createUser({ githubUsername: "aysel" });
    await createAllTimeStats(user.id, { commits: 500 });

    const result = await callTool("get_all_time_leaderboard");

    expect(result.structuredContent).toMatchObject({ count: 1, entries: [{ commits: 500 }] });
  });

  test("get_blog_posts lists posts with ISO dates", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "hello", createdAt: new Date("2026-07-01T00:00:00Z") });

    const result = await callTool("get_blog_posts");

    expect(result.structuredContent).toMatchObject({
      count: 1,
      posts: [{ slug: "hello", createdAt: "2026-07-01T00:00:00.000Z" }],
    });
  });

  describe("get_blog_post", () => {
    test("returns the post body", async () => {
      const author = await createUser({ githubUsername: "aysel" });
      await createBlogPost(author.id, { slug: "hello", contentMdx: "# Hi" });

      const result = await callTool("get_blog_post", { slug: "hello" });

      expect(result.structuredContent).toMatchObject({
        slug: "hello",
        contentMdx: "# Hi",
        author: { githubUsername: "aysel" },
      });
    });

    test("reports an unknown slug as a tool error", async () => {
      const result = await callTool("get_blog_post", { slug: "nope" });
      expect(result).toMatchObject({ isError: true, content: [{ text: 'No blog post found with slug "nope".' }] });
    });
  });

  test("get_showcase_projects lists projects", async () => {
    await createShowcaseProject({ repo: "acme/rocket", stars: 5 });

    const result = await callTool("get_showcase_projects");

    expect(result.structuredContent).toMatchObject({ count: 1, projects: [{ repo: "acme/rocket", stars: 5 }] });
  });

  test("hides internal errors behind a generic tool error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const author = await createUser();
    await createBlogPost(author.id, { slug: "post" });
    // Make the handler throw mid-serialization, like an unexpected bug would.
    vi.spyOn(Date.prototype, "toISOString").mockImplementationOnce(() => {
      throw new Error("internal detail");
    });

    const result = await callTool("get_blog_posts");

    expect(result).toEqual({
      content: [{ type: "text", text: "get_blog_posts failed. Please try again." }],
      isError: true,
    });
    expect(log).toHaveBeenCalledWith("[mcp] get_blog_posts failed:", expect.any(Error));
  });

  test("applies the Open Data API rate limit before handling the request", async () => {
    upstash.setUsage("odapi:min", "192.0.2.99", 20);

    const { res, body } = await rpc("tools/list", {}, "192.0.2.99");

    expect(res.status).toBe(429);
    expect(body).toEqual({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Rate limit exceeded" } });
    expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
  });

  test("keeps serving when the rate limiter is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    upstash.failWith = 503;

    const { res, body } = await rpc("tools/list");

    expect(res.status).toBe(200);
    expect(body.result.tools).toHaveLength(6);
  });

  test("serves GET on the same handler", () => {
    expect(GET).toBe(POST);
  });
});
