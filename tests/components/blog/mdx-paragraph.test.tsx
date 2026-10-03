import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MdxImage } from "@/components/blog/mdx-image";
import { MdxParagraph } from "@/components/blog/mdx-paragraph";

describe("MdxParagraph", () => {
  test("wraps text in a paragraph", () => {
    const { container } = render(<MdxParagraph>Plain text</MdxParagraph>);
    expect(container.innerHTML).toBe("<p>Plain text</p>");
  });

  test("drops the paragraph around images so <figure> never nests in <p>", () => {
    const { container } = render(
      <MdxParagraph>
        <MdxImage src="https://example.com/a.png" alt="A" />
      </MdxParagraph>,
    );
    expect(container.querySelector("p")).toBeNull();
    expect(screen.getByRole("img", { name: "A" }).closest("figure")).toBeInTheDocument();
  });
});
