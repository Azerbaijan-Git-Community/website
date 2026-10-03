import { describe, expect, test } from "vitest";
import Image, { alt, contentType, size } from "@/app/showcase/opengraph-image";
import { createShowcaseProject, testPrisma } from "@test/db";
import { readPng, serveRemoteImages } from "@test/og";

describe("showcase OG image", () => {
  test("declares its metadata", () => {
    expect({ alt, size, contentType }).toEqual({
      alt: "Open Source Showcase — Azerbaijan GitHub Community",
      size: { width: 1200, height: 630 },
      contentType: "image/png",
    });
  });

  test("renders the three newest projects, using GitHub's OG card when there's no banner", async () => {
    const { fetched } = serveRemoteImages();
    await createShowcaseProject({ repo: "acme/oldest", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createShowcaseProject({ repo: "acme/no-banner", createdAt: new Date("2026-02-01T00:00:00Z") });
    await createShowcaseProject({ repo: "acme/second", createdAt: new Date("2026-03-01T00:00:00Z") });
    const withBanner = await createShowcaseProject({
      repo: "acme/newest",
      createdAt: new Date("2026-04-01T00:00:00Z"),
    });
    await testPrisma.showcaseProject.update({
      where: { id: withBanner.id },
      data: { banner: "https://images.test/banner.png", license: "MIT", language: "Go", languageColor: "#00ADD8" },
    });

    const res = await Image();

    await expect(readPng(res)).resolves.toEqual({ isPng: true, width: 1200, height: 630 });
    expect(fetched.toSorted()).toEqual([
      "https://images.test/banner.png",
      "https://opengraph.githubassets.com/1/acme/no-banner",
      "https://opengraph.githubassets.com/1/acme/second",
    ]);
  });

  test("renders an empty state without projects", async () => {
    await expect(readPng(await Image())).resolves.toMatchObject({ isPng: true });
  });
});
