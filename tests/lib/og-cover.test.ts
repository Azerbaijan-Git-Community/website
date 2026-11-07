import { http, HttpResponse } from "msw";
import sharp from "sharp";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadOgCover } from "@/lib/og-cover";
import { server } from "@test/msw";

const COVER = "https://cdn.example/cover";
const solid = () => sharp({ create: { width: 40, height: 20, channels: 3, background: "#ff0000" } });
const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="red"/></svg>';

function serve(body: Uint8Array | string, contentType: string, status = 200) {
  server.use(http.get(COVER, () => new HttpResponse(body, { status, headers: { "content-type": contentType } })));
}

const decoded = async (dataUrl: string | null) => {
  expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  return sharp(Buffer.from(dataUrl!.split(",")[1], "base64")).metadata();
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("loadOgCover converts every format members actually use", () => {
  test.each([
    ["WebP", () => solid().webp().toBuffer(), "image/webp"],
    ["PNG", () => solid().png().toBuffer(), "image/png"],
    ["JPEG", () => solid().jpeg().toBuffer(), "image/jpeg"],
    ["SVG", async () => Buffer.from(SVG), "image/svg+xml"],
  ])("%s", async (_format, make, contentType) => {
    serve(new Uint8Array(await make()), contentType);
    expect(await decoded(await loadOgCover(COVER))).toMatchObject({ format: "jpeg", width: 700, height: 350 });
  });

  test("a transparent banner gets a dark background, not black or white artefacts", async () => {
    const transparent = await sharp({
      create: { width: 10, height: 10, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();
    serve(new Uint8Array(transparent), "image/png");
    const dataUrl = await loadOgCover(COVER);
    const { dominant } = await sharp(Buffer.from(dataUrl!.split(",")[1], "base64")).stats();
    expect(dominant.b).toBeGreaterThan(dominant.r);
    expect(dominant.b).toBeLessThan(80);
  });
});

describe("loadOgCover gives up quietly, so one banner can't break the image", () => {
  test("bytes that aren't an image", async () => {
    serve("<html>not an image</html>", "text/html");
    await expect(loadOgCover(COVER)).resolves.toBeNull();
  });

  test("an error from the host", async () => {
    serve("gone", "text/plain", 404);
    await expect(loadOgCover(COVER)).resolves.toBeNull();
  });

  test("a network failure", async () => {
    server.use(http.get(COVER, () => HttpResponse.error()));
    await expect(loadOgCover(COVER)).resolves.toBeNull();
  });

  test("a file that's too large, without decoding it", async () => {
    server.use(
      http.get(COVER, () => new HttpResponse(null, { headers: { "content-length": String(11 * 1024 * 1024) } })),
    );
    await expect(loadOgCover(COVER)).resolves.toBeNull();
  });

  test.each(["http://insecure.example/a.png", "file:///etc/passwd", "not a url"])(
    "a URL it won't fetch: %s",
    async (url) => {
      await expect(loadOgCover(url)).resolves.toBeNull();
    },
  );
});

test("the site's own default cover works over HTTP in local development", async () => {
  server.use(
    http.get(
      "http://localhost:3000/azgit_1024_white.png",
      async () =>
        new HttpResponse(new Uint8Array(await solid().png().toBuffer()), { headers: { "content-type": "image/png" } }),
    ),
  );
  await expect(loadOgCover("http://localhost:3000/azgit_1024_white.png")).resolves.toMatch(/^data:image\/jpeg/);
});
