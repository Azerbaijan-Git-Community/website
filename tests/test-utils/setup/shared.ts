import type * as NextCache from "next/cache";
import { afterAll, afterEach, vi } from "vitest";
import { server } from "../msw";

// `cacheLife`/`cacheTag` throw outside a real Next "use cache" render, and `revalidateTag` needs a
// request store. Everything else in `next/cache` stays real; tests assert on `revalidateTag` calls.
vi.mock(import("next/cache"), async (importOriginal) => ({
  ...(await importOriginal()),
  // Accepts every overload (profile name or inline profile).
  cacheLife: vi.fn<(profile: string | object) => void>(),
  cacheTag: vi.fn<typeof NextCache.cacheTag>(),
  revalidateTag: vi.fn<typeof NextCache.revalidateTag>(),
}));

// Listen before any test module loads: some clients (e.g. better-auth) capture `fetch` at import time.
server.listen({ onUnhandledFrame: "error" });
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
