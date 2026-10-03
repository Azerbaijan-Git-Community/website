import { describe, expect, test, vi } from "vitest";
import { err, ok } from "@/lib/action-helpers";

describe("ok", () => {
  test("wraps data in a success result", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });

  test("allows an empty success", () => {
    expect(ok()).toEqual({ ok: true, data: undefined });
  });
});

describe("err", () => {
  test.for([
    ["a string", "Nope", "Nope"],
    ["an Error", new Error("Boom"), "Boom"],
    ["an object with a message", { message: "From object" }, "From object"],
  ] as const)("extracts the message from %s", ([, input, message]) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(err(input)).toEqual({ ok: false, error: message });
  });

  test.for([null, undefined, 42, { message: 42 }, {}])("falls back to a generic message for %o", (input) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(err(input)).toEqual({ ok: false, error: "Something went wrong on our side." });
  });

  test("truncates messages longer than 300 characters", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = err("x".repeat(400));
    expect(result.error).toHaveLength(300);
    expect(result.error.endsWith("...")).toBe(true);
  });

  test("keeps a message of exactly 300 characters intact", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(err("y".repeat(300))).toEqual({ ok: false, error: "y".repeat(300) });
  });

  test("logs the original error", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("logged");
    err(error);
    expect(log).toHaveBeenCalledWith(error);
  });
});
