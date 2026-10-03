import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { WhySection } from "@/components/landing/why-section";

describe("WhySection", () => {
  test("is the #about anchor target with three challenge cards", () => {
    const { container } = render(<WhySection />);

    expect(container.querySelector("section#about")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Talent is Scattered",
      "No Open-Source Culture",
      "Global Innovation Index (2025)",
    ]);
  });

  test("shows the GII ranking stat only on the highlighted card", () => {
    render(<WhySection />);
    expect(screen.getAllByText("94 / 139")).toHaveLength(1);
  });
});
