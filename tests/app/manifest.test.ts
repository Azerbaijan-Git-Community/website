import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import manifest from "@/app/manifest";

describe("manifest", () => {
  test("describes an installable standalone app in the site's dark theme", () => {
    expect(manifest()).toMatchObject({
      name: "Azerbaijan GitHub Community",
      short_name: "AzGit",
      start_url: "/",
      display: "standalone",
      background_color: "#0d1117",
      theme_color: "#0d1117",
    });
  });

  test("references icons that exist in the app directory", () => {
    for (const icon of manifest().icons ?? []) {
      expect(existsSync(join(process.cwd(), "src/app", icon.src))).toBe(true);
    }
  });
});
