import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ImpactSection } from "@/components/landing/impact-section";

describe("ImpactSection", () => {
  test("lists the five national impact goals", () => {
    const { container } = render(<ImpactSection />);

    expect(container.querySelector("section#impact")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("National Impact Goals");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Boost GII Ranking",
      "Unite Talent Nationwide",
      "Create a Digital Culture",
      "Expand Open-Source",
      "Build Innovation Metrics",
    ]);
  });
});
