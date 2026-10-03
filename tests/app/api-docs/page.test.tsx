import { readFileSync } from "node:fs";
import { join } from "node:path";
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ApiDocsPage, { metadata } from "@/app/api-docs/page";
import { ALL_SECTION_IDS, ENDPOINTS } from "@/components/api-docs/endpoints";
import { renderServer } from "@test/render-server";

describe("ApiDocsPage", () => {
  test("renders a section for every sidebar entry", async () => {
    const { container } = await renderServer(<ApiDocsPage />);
    for (const id of ALL_SECTION_IDS) expect(container.querySelector(`#${id}`)).toBeInTheDocument();
  });

  test("groups endpoint cards by category in the documented order", async () => {
    const { container } = await renderServer(<ApiDocsPage />);
    const cards = [...container.querySelectorAll("section[id]")]
      .map((s) => s.id)
      .filter((id) => ENDPOINTS.some((e) => e.id === id));
    expect(cards).toEqual(ENDPOINTS.map((e) => e.id));
  });

  test("shows the base URL and the MCP endpoint for this deployment", async () => {
    const { container } = await renderServer(<ApiDocsPage />);
    expect(screen.getAllByText("http://localhost:3000/api/v1").length).toBeGreaterThan(0);
    expect(container.querySelector("#mcp")).toHaveTextContent("http://localhost:3000/api/mcp/mcp");
  });

  test("states the same rate limits the API enforces", async () => {
    const { container } = await renderServer(<ApiDocsPage />);
    expect(container.querySelector("#rate-limits")).toHaveTextContent("Per-minute request cap (20).");
    expect(container.querySelector("#rate-limits")).toHaveTextContent("Per-day request cap (500).");
  });

  test("embeds the Zod schema source verbatim", async () => {
    const { container } = await renderServer(<ApiDocsPage />);
    const source = readFileSync(join(process.cwd(), "src/lib/api/schemas.ts"), "utf8");
    const blocks = [...container.querySelectorAll("#schemas pre code")].map((c) => c.textContent);
    expect(blocks).toContain(source);
  });

  test("lists every MCP tool", async () => {
    const { container } = await renderServer(<ApiDocsPage />);
    for (const tool of [
      "get_stats",
      "get_leaderboard",
      "get_all_time_leaderboard",
      "get_blog_posts",
      "get_blog_post",
      "get_showcase_projects",
    ]) {
      expect(container.querySelector("#mcp")).toHaveTextContent(tool);
    }
  });

  test("declares its canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/api-docs");
  });
});
