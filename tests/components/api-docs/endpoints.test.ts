import { describe, expect, test } from "vitest";
import { z } from "zod";
import { ALL_SECTION_IDS, DOC_NAV, ENDPOINTS, fillPath } from "@/components/api-docs/endpoints";
import { buildOpenApiDocument } from "@/lib/api/openapi";

describe("fillPath", () => {
  test("replaces every {token} with its value", () => {
    expect(fillPath("/api/v1/leaderboard/{year}/{month}", { year: "2026", month: "07" })).toBe(
      "/api/v1/leaderboard/2026/07",
    );
  });

  test("URL-encodes values", () => {
    expect(fillPath("/api/v1/blog/{slug}", { slug: "a b/c?d" })).toBe("/api/v1/blog/a%20b%2Fc%3Fd");
  });

  test("leaves a placeholder for missing values", () => {
    expect(fillPath("/api/v1/blog/{slug}", {})).toBe("/api/v1/blog/%7Bslug%7D");
  });

  test("returns paths without tokens unchanged", () => {
    expect(fillPath("/api/v1/stats", { slug: "x" })).toBe("/api/v1/stats");
  });
});

describe("ENDPOINTS", () => {
  test("documents exactly the routes in the OpenAPI spec", () => {
    const { paths } = z.object({ paths: z.record(z.string(), z.unknown()) }).parse(buildOpenApiDocument());
    const specPaths = Object.keys(paths);
    const docPaths = ENDPOINTS.map((e) => e.path.replace("/api/v1", ""));
    expect(docPaths.toSorted()).toEqual(specPaths.toSorted());
  });

  test("provides an example for every path parameter", () => {
    for (const endpoint of ENDPOINTS) {
      const tokens = [...endpoint.path.matchAll(/\{(\w+)\}/g)].map(([, name]) => name);
      expect((endpoint.params ?? []).map((p) => p.name)).toEqual(tokens);
      for (const param of endpoint.params ?? []) expect(param.example).not.toBe("");
    }
  });
});

describe("docs navigation", () => {
  test("has unique section ids covering guide, endpoints and reference", () => {
    expect(new Set(ALL_SECTION_IDS).size).toBe(ALL_SECTION_IDS.length);
    expect(ALL_SECTION_IDS[0]).toBe("introduction");
    expect(ALL_SECTION_IDS.at(-1)).toBe("schemas");
    for (const endpoint of ENDPOINTS) expect(ALL_SECTION_IDS).toContain(endpoint.id);
  });

  test("labels endpoints with their path relative to /api/v1", () => {
    const endpointsGroup = DOC_NAV.find((g) => g.group === "Endpoints");
    expect(endpointsGroup?.items[0]).toEqual({ id: "stats", label: "/stats" });
  });

  test("every nav item is a known section", () => {
    for (const item of DOC_NAV.flatMap((g) => g.items)) expect(ALL_SECTION_IDS).toContain(item.id);
  });
});
