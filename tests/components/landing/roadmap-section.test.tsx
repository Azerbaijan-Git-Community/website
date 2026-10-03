import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { RoadmapSection } from "@/components/landing/roadmap-section";

describe("RoadmapSection", () => {
  test("walks through the five stages in order", () => {
    const { container } = render(<RoadmapSection />);

    expect(container.querySelector("section#roadmap")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Launch & Onboarding",
      "Expansion",
      "National Hub",
      "Scaling & AI",
      "The Goal Achieved",
    ]);
  });

  test("highlights only the final stage", () => {
    render(<RoadmapSection />);
    const highlighted = screen.getAllByText(/^Stage \d$/).filter((label) => label.classList.contains("text-gradient"));
    expect(highlighted.map((label) => label.textContent)).toEqual(["Stage 5"]);
  });
});
