import { afterEach, describe, expect, test, vi } from "vitest";
import { clientEnv, clientEnvSchema } from "@/lib/env.client";

const valid = {
  NEXT_PUBLIC_BASE_URL: "https://githubcommunity.az",
  NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL: "https://kv.better-auth.com/projects/abc",
};

afterEach(() => {
  vi.resetModules();
});

describe("clientEnvSchema", () => {
  test("accepts absolute URLs without trailing slashes", () => {
    expect(clientEnvSchema.parse(valid)).toEqual(valid);
  });

  test.for(["NEXT_PUBLIC_BASE_URL", "NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL"] as const)(
    "rejects a trailing slash on %s",
    (key) => {
      const result = clientEnvSchema.safeParse({ ...valid, [key]: `${valid[key]}/` });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(`${key} must not have a trailing slash`);
    },
  );

  test("rejects non-URL and missing values", () => {
    expect(clientEnvSchema.safeParse({ ...valid, NEXT_PUBLIC_BASE_URL: "githubcommunity.az" }).success).toBe(false);
    expect(clientEnvSchema.safeParse({ NEXT_PUBLIC_BASE_URL: valid.NEXT_PUBLIC_BASE_URL }).success).toBe(false);
  });
});

describe("clientEnv", () => {
  test("is parsed from process.env", () => {
    expect(clientEnv).toEqual({
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
      NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL: "https://kv.better-auth.com/projects/test",
    });
  });

  test("throws at import time when the env is invalid", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000/");
    await expect(import("@/lib/env.client")).rejects.toThrow("must not have a trailing slash");
  });
});
