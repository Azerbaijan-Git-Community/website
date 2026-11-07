import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { BlogConnectCtaFallback } from "@/components/blog/blog-connect-cta";

test("the placeholder keeps the button's height and is hidden from screen readers", () => {
  render(<BlogConnectCtaFallback />);
  const skeleton = screen.getByTestId("connect-skeleton");
  expect(skeleton).toHaveClass("h-10");
  expect(skeleton).toHaveAttribute("aria-hidden", "true");
});
