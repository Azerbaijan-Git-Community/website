import { describe, expect, test } from "vitest";
import { cacheTags } from "@/lib/cache-tags";

describe("cacheTags", () => {
  test("exposes stable static tags", () => {
    expect(cacheTags).toMatchObject({ blog: "blog", showcase: "showcase", leaderboard: "leaderboard" });
  });

  test("builds a per-post tag that differs from the list tag", () => {
    expect(cacheTags.blogPost("hello-world")).toBe("blog-hello-world");
    expect(cacheTags.blogPost("hello-world")).not.toBe(cacheTags.blog);
  });
});
