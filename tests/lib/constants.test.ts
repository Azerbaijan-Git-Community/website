import { describe, expect, test } from "vitest";
import { GITHUB_ORG, navigationLinks, SYNC_INTERVAL_MS, SYNC_TARGETS } from "@/lib/constants";

describe("constants", () => {
  test("sync interval matches the hourly QStash schedule", () => {
    expect(SYNC_INTERVAL_MS).toBe(60 * 60 * 1000);
  });

  test("lists every manual sync target exactly once", () => {
    expect(SYNC_TARGETS).toEqual(["blog", "showcase", "showcase-data", "github"]);
  });

  test("points at the community GitHub org", () => {
    expect(GITHUB_ORG).toBe("Azerbaijan-Git-Community");
  });

  test("navigation links are unique internal routes, starting with Home", () => {
    const hrefs = navigationLinks.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href.startsWith("/")).toBe(true);
    expect(navigationLinks[0]).toEqual({ href: "/", label: "Home" });
  });
});
