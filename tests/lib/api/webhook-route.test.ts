import { NextRequest } from "next/server";
import { describe, expect, test, vi } from "vitest";
import { webhookRoute } from "@/lib/api/webhook-route";

function post(authorization?: string) {
  return new NextRequest("http://localhost:3000/api/webhooks/test", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

function createRoute() {
  const run = vi.fn<() => Promise<{ synced: number; skipped: number }>>(async () => ({ synced: 2, skipped: 1 }));
  const POST = webhookRoute({ secret: "hook-secret", run, message: (r) => `Synced ${r.synced}` });
  return { POST, run };
}

describe("webhookRoute", () => {
  test.for([
    ["no Authorization header", undefined],
    ["a wrong secret", "Bearer nope"],
    ["the secret without the Bearer scheme", "hook-secret"],
  ] as const)("rejects %s with 401 and does not run the sync", async ([, authorization]) => {
    const { POST, run } = createRoute();
    const res = await POST(post(authorization));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(run).not.toHaveBeenCalled();
  });

  test("runs the sync and returns its result with a summary message", async () => {
    const { POST, run } = createRoute();
    const res = await POST(post("Bearer hook-secret"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, synced: 2, skipped: 1, message: "Synced 2" });
    expect(run).toHaveBeenCalledOnce();
  });

  test("propagates sync failures to the caller", async () => {
    const POST = webhookRoute({
      secret: "hook-secret",
      run: () => Promise.reject(new Error("GitHub is down")),
      message: () => "",
    });
    await expect(POST(post("Bearer hook-secret"))).rejects.toThrow("GitHub is down");
  });
});
