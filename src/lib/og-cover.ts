import "server-only";
import { cacheLife } from "next/cache";
import sharp from "sharp";
import { clientEnv } from "@/lib/env.client";

const TIMEOUT_MS = 5000;
const MAX_BYTES = 10 * 1024 * 1024;
const COVER_WIDTH = 700;
const COVER_HEIGHT = 350;

/**
 * A member's banner as a JPEG data URL, or null if it can't be used. The OG renderer can't decode every
 * format and fails the whole image on one bad file, so banners are converted here, where a failure costs one card.
 */
export async function loadOgCover(cover: string): Promise<string | null> {
  "use cache";
  // Short enough that a banner host's bad moment doesn't stick to the image for long.
  cacheLife("hours");

  try {
    const url = new URL(cover);
    if (url.protocol !== "https:" && url.origin !== new URL(clientEnv.NEXT_PUBLIC_BASE_URL).origin) return null;

    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok || Number(res.headers.get("content-length")) > MAX_BYTES) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES) return null;

    const jpeg = await sharp(bytes)
      .resize(COVER_WIDTH, COVER_HEIGHT, { fit: "cover" })
      .flatten({ background: "#161b22" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.warn(`[og] could not use cover ${cover}:`, error);
    return null;
  }
}
