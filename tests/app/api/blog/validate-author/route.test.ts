import { describe, expect, test } from "vitest";
import { GET } from "@/app/api/blog/validate-author/route";
import { createUser } from "@test/db";
import { request } from "@test/request";

function validate(githubId: string | null, authorization = "Bearer test-author-secret") {
  const query = githubId === null ? "" : `?githubId=${encodeURIComponent(githubId)}`;
  return GET(request(`/api/blog/validate-author${query}`, { headers: { authorization } }));
}

describe("GET /api/blog/validate-author", () => {
  test("rejects callers without the author validation secret", async () => {
    const res = await validate("1", "Bearer wrong");
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test.for([
    ["missing", null],
    ["empty", ""],
    ["non-numeric", "octocat"],
    ["negative", "-5"],
    ["decimal", "1.5"],
    ["partially numeric", "12abc"],
  ])("rejects a %s githubId with 400", async ([, githubId]) => {
    const res = await validate(githubId);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid githubId" });
  });

  test("confirms a registered author", async () => {
    await createUser({ githubId: 5150 });
    const res = await validate("5150");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ exists: true });
  });

  test("tells unregistered authors to sign up", async () => {
    const res = await validate("404404");
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      exists: false,
      message: "You need to signup in website for publishing blog post",
    });
  });

  test("refuses banned authors", async () => {
    await createUser({ githubId: 666, banned: true });
    const res = await validate("666");
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      exists: false,
      message: "Your account has been banned from publishing blog posts",
    });
  });

  test("BUG-11: answers 'not registered' for ids beyond the 32-bit range instead of crashing", async () => {
    const res = await validate("99999999999");
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ exists: false });
  });

  test("still finds an author at the top of the 32-bit range", async () => {
    await createUser({ githubId: 2_147_483_647 });
    expect((await validate("2147483647")).status).toBe(200);
  });
});
