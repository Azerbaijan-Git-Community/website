import { beforeEach } from "vitest";
import { resetDb, testPrisma } from "../db";
import "./shared";

// `src/lib/prisma.ts` reuses `globalThis.prisma` when present, so app code picks up the PGlite client.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
(globalThis as unknown as { prisma: typeof testPrisma }).prisma = testPrisma;

beforeEach(() => resetDb());
