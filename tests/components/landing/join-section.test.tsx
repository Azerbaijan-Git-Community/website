import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { JoinSection } from "@/components/landing/join-section";

describe("JoinSection", () => {
  test("is the #join anchor target", () => {
    const { container } = render(<JoinSection />);
    expect(container.querySelector("section#join")).toBeInTheDocument();
  });

  test.for([
    ["Join on GitHub", "https://github.com/Azerbaijan-Git-Community"],
    ["Telegram Community", "https://t.me/github_azerbaijan"],
    ["Signal Community", /^https:\/\/signal\.group\/#/],
  ] as const)("links to %s in a new tab", ([name, href]) => {
    render(<JoinSection />);
    const link = screen.getByRole("link", { name });
    expect(link.getAttribute("href")).toMatch(href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
