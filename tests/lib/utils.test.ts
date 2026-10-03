import { describe, expect, test } from "vitest";
import { ResponseSchema } from "@/lib/utils";

describe("ResponseSchema", () => {
  test("accepts message and/or error strings", () => {
    expect(ResponseSchema.parse({ message: "ok" })).toEqual({ message: "ok" });
    expect(ResponseSchema.parse({ error: "bad" })).toEqual({ error: "bad" });
    expect(ResponseSchema.parse({})).toEqual({});
  });

  test("strips unknown keys from webhook payloads", () => {
    expect(ResponseSchema.parse({ ok: true, synced: 3, message: "Synced 3" })).toEqual({ message: "Synced 3" });
  });

  test("rejects non-string messages", () => {
    expect(ResponseSchema.safeParse({ error: { code: "x" } }).success).toBe(false);
  });
});
