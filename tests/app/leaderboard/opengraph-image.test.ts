import { describe, expect, test } from "vitest";
import Image, { alt, contentType, size } from "@/app/leaderboard/opengraph-image";
import { createSnapshot, createUser } from "@test/db";
import { readPng, serveRemoteImages } from "@test/og";

describe("leaderboard OG image", () => {
  test("declares its metadata", () => {
    expect({ alt, size, contentType }).toEqual({
      alt: "Monthly Leaderboard — Azerbaijan GitHub Community",
      size: { width: 1200, height: 630 },
      contentType: "image/png",
    });
  });

  test("renders the latest month's podium with avatars", async () => {
    const { fetched } = serveRemoteImages();
    for (const i of [1, 2, 3]) {
      const user = await createUser({ image: `https://images.test/avatar-${i}.png` });
      await createSnapshot(user.id, "MONTHLY", "2026-07", { commits: i * 100 });
    }
    const older = await createUser({ image: "https://images.test/old.png" });
    await createSnapshot(older.id, "MONTHLY", "2026-06", { commits: 1 });

    const res = await Image();

    await expect(readPng(res)).resolves.toEqual({ isPng: true, width: 1200, height: 630 });
    expect(fetched.toSorted()).toEqual([
      "https://images.test/avatar-1.png",
      "https://images.test/avatar-2.png",
      "https://images.test/avatar-3.png",
    ]);
  });

  test("renders a fallback when fewer than three contributors exist", async () => {
    const { fetched } = serveRemoteImages();
    const user = await createUser({ image: "https://images.test/solo.png" });
    await createSnapshot(user.id, "MONTHLY", "2026-07", { commits: 5 });

    await expect(readPng(await Image())).resolves.toMatchObject({ isPng: true });
    expect(fetched).toEqual([]);
  });

  test("renders with no data at all", async () => {
    await expect(readPng(await Image())).resolves.toMatchObject({ isPng: true });
  });
});
