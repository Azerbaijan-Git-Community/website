import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Footer } from "@/components/footer";

function linksUnder(heading: string) {
  return within(screen.getByRole("heading", { name: heading }).parentElement!)
    .getAllByRole("link")
    .map((a) => [a.textContent, a.getAttribute("href")]);
}

describe("Footer", () => {
  test("groups community, resource and social links", () => {
    render(<Footer />);

    expect(linksUnder("Community")).toEqual([
      ["Blog", "/blog"],
      ["Leaderboard", "/leaderboard"],
      ["Showcase", "/showcase"],
    ]);
    expect(linksUnder("Resources")).toEqual([["API Docs", "/api-docs"]]);
    expect(linksUnder("Connect")).toEqual([
      ["LinkedIn", "https://www.linkedin.com/company/github-azerbaijan/"],
      ["Instagram", "https://www.instagram.com/azerbaijan_github_community/"],
      ["Telegram", "https://t.me/github_azerbaijan"],
    ]);
  });

  test("shows the logo and copyright", () => {
    render(<Footer />);
    expect(screen.getByRole("img", { name: "GitHub Azerbaijan" })).toBeInTheDocument();
    expect(screen.getByText(/© 2026 Azerbaijan GitHub Community/)).toBeInTheDocument();
  });
});
