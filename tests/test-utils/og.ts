import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { server } from "./msw";

const png = readFileSync(join(process.cwd(), "src/app/icon.png"));

/** Serve a real PNG for every remote image host the OG images embed; returns the URLs that were fetched. */
export function serveRemoteImages() {
  const fetched: string[] = [];
  const respond = ({ request }: { request: Request }) => {
    fetched.push(request.url);
    return new HttpResponse(png, { headers: { "content-type": "image/png" } });
  };
  server.use(
    http.get("https://raw.githubusercontent.com/*", respond),
    http.get("https://avatars.githubusercontent.com/*", respond),
    http.get("https://opengraph.githubassets.com/*", respond),
    http.get("https://images.test/*", respond),
  );
  return { fetched };
}

/** Read a rendered ImageResponse and return its PNG dimensions (from the IHDR chunk). */
export async function readPng(res: Response) {
  const bytes = Buffer.from(await res.arrayBuffer());
  return {
    isPng: bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}
