import { describe, expect, test } from "vitest";
import { buildOpenApiDocument } from "@/lib/api/openapi";

type Doc = {
  openapi: string;
  servers: { url: string }[];
  paths: Record<string, { get: { operationId: string; responses: Record<string, unknown> } }>;
  components: { schemas: Record<string, { type?: string; required?: string[] }> };
};

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const doc = buildOpenApiDocument() as Doc;

function collectRefs(node: unknown, refs: string[] = []): string[] {
  if (Array.isArray(node)) for (const item of node) collectRefs(item, refs);
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$ref" && typeof value === "string") refs.push(value);
      else collectRefs(value, refs);
    }
  }
  return refs;
}

describe("buildOpenApiDocument", () => {
  test("is an OpenAPI 3.1 document served from the v1 base URL", () => {
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.servers).toEqual([{ url: "http://localhost:3000/api/v1", description: "Production" }]);
  });

  test("documents every public route with a unique operationId", () => {
    expect(Object.keys(doc.paths).toSorted()).toEqual([
      "/blog",
      "/blog/{slug}",
      "/leaderboard",
      "/leaderboard/all-time",
      "/leaderboard/{year}/{month}",
      "/showcase",
      "/stats",
    ]);
    const ids = Object.values(doc.paths).map((p) => p.get.operationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every operation documents 200, 429 and 500", () => {
    for (const { get } of Object.values(doc.paths)) {
      expect(Object.keys(get.responses)).toEqual(expect.arrayContaining(["200", "429", "500"]));
    }
  });

  test("documents 400 and 404 where the route can return them", () => {
    expect(Object.keys(doc.paths["/leaderboard/{year}/{month}"].get.responses)).toEqual(
      expect.arrayContaining(["400", "404"]),
    );
    expect(Object.keys(doc.paths["/blog/{slug}"].get.responses)).toContain("404");
  });

  test("every $ref points at a defined component schema", () => {
    const refs = new Set(collectRefs(doc.paths));
    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(doc.components.schemas).toHaveProperty(ref.replace("#/components/schemas/", ""));
    }
  });

  test("component schemas are generated from the Zod schemas", () => {
    expect(doc.components.schemas.Stats).toMatchObject({
      type: "object",
      required: ["totalCommits", "totalPullRequests", "totalUsers", "lastSyncedAt"],
    });
    expect(doc.components.schemas.ApiError.required).toEqual(["error"]);
  });

  test("is JSON-serializable", () => {
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
  });
});
