import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MdxImage } from "@/components/blog/mdx-image";

describe("MdxImage", () => {
  test("renders the image unoptimized inside a figure", () => {
    const { container } = render(<MdxImage src="https://example.com/diagram.png" alt="Diagram" />);
    const img = screen.getByRole("img", { name: "Diagram" });
    expect(img).toHaveAttribute("src", "https://example.com/diagram.png");
    expect(container.firstElementChild?.tagName).toBe("FIGURE");
  });

  test("defaults alt text to empty", () => {
    const { container } = render(<MdxImage src="https://example.com/a.png" />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  test("renders nothing without a string src", () => {
    expect(render(<MdxImage />).container).toBeEmptyDOMElement();
    expect(render(<MdxImage src={undefined} alt="x" />).container).toBeEmptyDOMElement();
  });
});
