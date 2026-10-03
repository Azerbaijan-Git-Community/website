import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ReadingTimeBadge } from "@/components/blog/reading-time-badge";

describe("ReadingTimeBadge", () => {
  test("shows the reading time in minutes", () => {
    render(<ReadingTimeBadge minutes={7} />);
    expect(screen.getByText("7 min read")).toBeInTheDocument();
  });

  test("renders a clock icon", () => {
    const { container } = render(<ReadingTimeBadge minutes={1} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
