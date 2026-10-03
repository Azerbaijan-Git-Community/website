import type * as NextHeaders from "next/headers";
import { vi } from "vitest";

/**
 * Request headers seen by `next/headers` `headers()`. `vi.mock` is file-scoped, so each test file that renders
 * code calling `headers()` registers the mock itself:
 *
 *   vi.mock(import("next/headers"), async (importOriginal) =>
 *     (await import("@test/next-headers")).mockNextHeaders(importOriginal),
 *   );
 */
export const incomingRequest = { headers: new Headers() };

export async function mockNextHeaders(importOriginal: () => Promise<typeof NextHeaders>) {
  return {
    ...(await importOriginal()),
    // `headers()` needs a live Next request scope; serve the test's incoming headers instead.
    headers: vi.fn<typeof NextHeaders.headers>(async () => incomingRequest.headers),
  };
}
