import { describe, expect, test } from "vitest";
import Image, { alt, contentType, size } from "@/app/blog/opengraph-image";
import { createBlogPost, createUser } from "@test/db";
import { readPng, serveRemoteImages } from "@test/og";

describe("blog OG image", () => {
  test("declares its metadata", () => {
    expect({ alt, size, contentType }).toEqual({
      alt: "Developer Blog — Azerbaijan GitHub Community",
      size: { width: 1200, height: 630 },
      contentType: "image/png",
    });
  });

  test("renders the three newest posts with their covers", async () => {
    const { fetched } = serveRemoteImages();
    const author = await createUser();
    for (const [i, slug] of ["p1", "p2", "p3", "p4"].entries()) {
      await createBlogPost(author.id, {
        slug,
        title: i === 0 ? "A very long title that will certainly be truncated in the card" : `Post ${slug}`,
        description: "d".repeat(120),
        createdAt: new Date(Date.UTC(2026, 0, i + 1)),
      });
    }

    const res = await Image();

    await expect(readPng(res)).resolves.toEqual({ isPng: true, width: 1200, height: 630 });
    expect(fetched.map((url) => url.split("/uploads/")[1]).toSorted()).toEqual(["p2.png", "p3.png", "p4.png"]);
  });

  test.each([
    ["an arbitrary host", "https://evil.example/cover.png"],
    ["a format the renderer can't decode", "https://omicron.example/api/uploads/cover.webp"],
  ])("draws no cover from %s, so one banner can't break the card", async (_label, coverImage) => {
    const { fetched } = serveRemoteImages();
    await createBlogPost((await createUser()).id, { coverImage });

    await expect(readPng(await Image())).resolves.toMatchObject({ isPng: true, width: 1200 });
    expect(fetched).toEqual([]);
  });

  test("renders an empty state without posts", async () => {
    await expect(readPng(await Image())).resolves.toMatchObject({ isPng: true, width: 1200 });
  });
});
