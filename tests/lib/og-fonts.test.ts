import { stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { getOgFonts } from "@/lib/og-fonts";

const fontsDir = join(process.cwd(), "assets", "fonts");

describe("getOgFonts", () => {
  test("loads Outfit Bold and Inter Regular for OG images", async () => {
    const fonts = await getOgFonts();
    expect(fonts.map(({ name, weight, style }) => ({ name, weight, style }))).toEqual([
      { name: "Outfit", weight: 700, style: "normal" },
      { name: "Inter", weight: 400, style: "normal" },
    ]);
  });

  test("returns each font file's exact bytes", async () => {
    const [outfit, inter] = await getOgFonts();
    expect(outfit.data.byteLength).toBe((await stat(join(fontsDir, "Outfit-Bold.ttf"))).size);
    expect(inter.data.byteLength).toBe((await stat(join(fontsDir, "Inter-Regular.ttf"))).size);
  });
});
