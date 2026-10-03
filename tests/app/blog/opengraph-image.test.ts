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
    expect(fetched.map((url) => url.split("/posts/")[1]).toSorted()).toEqual([
      "p2/images/cover.png",
      "p3/images/cover.png",
      "p4/images/cover.png",
    ]);
  });

  test("renders an empty state without posts", async () => {
    await expect(readPng(await Image())).resolves.toMatchObject({ isPng: true, width: 1200 });
  });
});
