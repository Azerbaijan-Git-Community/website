import { afterEach, describe, expect, test, vi } from "vitest";
import { testPrisma } from "@test/db";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const globalForPrisma = globalThis as { prisma?: unknown };

afterEach(() => {
  globalForPrisma.prisma = testPrisma;
  vi.resetModules();
});

// PrismaClient is a Proxy that overflows the diff printer, so these compare identities as booleans.
describe("prisma", () => {
  test("reuses the client cached on globalThis (survives dev hot reloads)", async () => {
    const { prisma } = await import("@/lib/prisma");
    expect(prisma === testPrisma).toBe(true);
  });

  test("creates and caches a new client outside production", async () => {
    globalForPrisma.prisma = undefined;
    vi.resetModules();
    const { prisma } = await import("@/lib/prisma");
    expect(typeof prisma.$connect).toBe("function");
    expect(prisma === testPrisma).toBe(false);
    expect(globalForPrisma.prisma === prisma).toBe(true);
  });

  test("does not cache the client on globalThis in production", async () => {
    globalForPrisma.prisma = undefined;
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { prisma } = await import("@/lib/prisma");
    expect(typeof prisma.$connect).toBe("function");
    expect(globalForPrisma.prisma === undefined).toBe(true);
  });
});
