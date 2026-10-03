import { describe, expect, test } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  test("allows crawling the site but not the API or admin console", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
      sitemap: "http://localhost:3000/sitemap.xml",
    });
  });
});
