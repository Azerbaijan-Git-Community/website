import { describe, expect, test } from "vitest";
import { buildSnippets } from "@/components/api-docs/snippets";

const URL = "https://githubcommunity.az/api/v1/stats";

describe("buildSnippets", () => {
  const snippets = buildSnippets(URL);

  test("covers the twelve advertised languages with unique ids", () => {
    expect(snippets.map((s) => s.label)).toEqual([
      "cURL",
      "JavaScript",
      "Node.js",
      "Python",
      "PHP",
      "Ruby",
      "Go",
      "Rust",
      "Java",
      "C",
      "C#",
      "Swift",
    ]);
    expect(new Set(snippets.map((s) => s.id)).size).toBe(12);
  });

  test("embeds the request URL in every snippet", () => {
    for (const snippet of snippets) expect(snippet.code).toContain(`"${URL}"`);
  });

  test("uses a Prism language for highlighting", () => {
    expect(Object.fromEntries(snippets.map((s) => [s.id, s.lang]))).toMatchObject({
      curl: "bash",
      javascript: "javascript",
      node: "javascript",
      csharp: "csharp",
    });
  });

  test("produces a runnable cURL command", () => {
    expect(snippets[0].code).toBe(`curl -s "${URL}"`);
  });
});
