import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";

export async function getOgFonts() {
  "use cache";
  cacheLife("max");
  const dir = join(process.cwd(), "assets", "fonts");

  const [outfitBold, interRegular] = await Promise.all([
    readFile(join(dir, "Outfit-Bold.ttf")),
    readFile(join(dir, "Inter-Regular.ttf")),
  ]);

  return [
    { name: "Outfit", data: outfitBold.buffer as ArrayBuffer, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: interRegular.buffer as ArrayBuffer, weight: 400 as const, style: "normal" as const },
  ];
}
