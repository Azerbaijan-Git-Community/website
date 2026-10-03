import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    dbSnapshotPath: string;
  }
}

// Build the schema into a PGlite snapshot once per run; loading it skips `initdb` (~1.3s) in every test file.
export default async function setup(project: TestProject) {
  const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
  const schemaSql = execFileSync(
    process.execPath,
    [prismaCli, "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      env: { ...process.env, DIRECT_URL: "postgresql://unused", PRISMA_HIDE_UPDATE_MESSAGE: "1" },
    },
  );

  const pglite = new PGlite();
  await pglite.exec(schemaSql);
  const snapshot = await pglite.dumpDataDir("none");
  await pglite.close();

  const dir = mkdtempSync(join(tmpdir(), "vitest-pglite-"));
  const dbSnapshotPath = join(dir, "snapshot.tar");
  writeFileSync(dbSnapshotPath, Buffer.from(await snapshot.arrayBuffer()));
  project.provide("dbSnapshotPath", dbSnapshotPath);

  return () => rmSync(dir, { recursive: true, force: true });
}
