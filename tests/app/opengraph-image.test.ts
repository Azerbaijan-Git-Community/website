import { describe, expect, test } from "vitest";
import Image, { alt, contentType, size } from "@/app/opengraph-image";
import { createAllTimeStats, createUser } from "@test/db";
import { readPng } from "@test/og";

describe("home OG image", () => {
  test("declares its metadata", () => {
    expect({ alt, size, contentType }).toEqual({
      alt: "Azerbaijan GitHub Community — National 5-Year Target",
      size: { width: 1200, height: 630 },
      contentType: "image/png",
    });
  });

  test("renders a 1200x630 PNG with community stats", async () => {
    const user = await createUser();
    await createAllTimeStats(user.id, { commits: 123_456 });

    const res = await Image();

    expect(res.headers.get("content-type")).toBe("image/png");
    await expect(readPng(res)).resolves.toEqual({ isPng: true, width: 1200, height: 630 });
  });

  test("renders before any stats exist", async () => {
    await expect(readPng(await Image())).resolves.toMatchObject({ isPng: true });
  });
});
