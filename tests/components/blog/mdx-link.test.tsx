import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MdxLink } from "@/components/blog/mdx-link";

describe("MdxLink", () => {
  test("opens external links in a new tab without leaking the opener", () => {
    render(<MdxLink href="https://github.com">GitHub</MdxLink>);
    const link = screen.getByRole("link", { name: "GitHub" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test.for(["/blog/other", "#section", "mailto:hi@example.com"])("keeps %s in the same tab", (href) => {
    render(<MdxLink href={href}>link</MdxLink>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", href);
    expect(link).not.toHaveAttribute("target");
  });

  test("passes other anchor props through", () => {
    render(
      <MdxLink href="#x" id="anchor" className="custom">
        x
      </MdxLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("id", "anchor");
    expect(screen.getByRole("link")).toHaveClass("custom");
  });
});
