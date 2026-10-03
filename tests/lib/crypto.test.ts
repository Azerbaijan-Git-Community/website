import { describe, expect, test } from "vitest";
import { isValidSecret } from "@/lib/crypto";

describe("isValidSecret", () => {
  test("accepts an exact match", () => {
    expect(isValidSecret("s3cret", "s3cret")).toBe(true);
  });

  test.for([
    ["a different value", "s3creT", "s3cret"],
    ["a longer value", "s3cret-longer", "s3cret"],
    ["a prefix of the secret", "s3c", "s3cret"],
    ["a missing provided value", null, "s3cret"],
    ["an empty provided value", "", "s3cret"],
    ["a missing expected value", "s3cret", null],
    ["empty values on both sides", "", ""],
  ] as const)("rejects %s", ([, provided, expected]) => {
    expect(isValidSecret(provided, expected)).toBe(false);
  });

  test("compares byte lengths, so multi-byte input can't crash timingSafeEqual", () => {
    expect(isValidSecret("é", "e")).toBe(false);
  });
});
