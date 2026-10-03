import { describe, expect, test } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/openapi.json/route";
import { buildOpenApiDocument } from "@/lib/api/openapi";

describe("GET /api/v1/openapi.json", () => {
  // No fake Upstash is installed: any rate-limit call would be an unhandled request and fail the test.
  test("serves the OpenAPI document without rate limiting", async () => {
    const res = GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(buildOpenApiDocument());
  });

  test("is publicly readable and edge-cacheable for an hour", () => {
    const res = GET();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=3600");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
