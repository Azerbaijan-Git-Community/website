import { beforeEach, describe, expect, test } from "vitest";
import { GET, OPTIONS } from "@/app/api/v1/showcase/route";
import { createShowcaseProject } from "@test/db";
import { request } from "@test/request";
import { useFakeUpstash } from "@test/upstash";

beforeEach(() => {
  useFakeUpstash();
});

describe("GET /api/v1/showcase", () => {
  test("lists projects newest first without the registry SHA", async () => {
    await createShowcaseProject({ repo: "a/old", createdAt: new Date("2026-01-01T00:00:00Z"), stars: 3 });
    await createShowcaseProject({ repo: "a/new", createdAt: new Date("2026-02-01T00:00:00Z") });

    const res = await GET(request("/api/v1/showcase"), undefined);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta).toEqual({ count: 2 });
    expect(body.data.map((p: { repo: string }) => p.repo)).toEqual(["a/new", "a/old"]);
    expect(body.data[1]).toMatchObject({ stars: 3, createdAt: "2026-01-01T00:00:00.000Z" });
    expect(body.data[0]).not.toHaveProperty("fileSha");
  });

  test("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
