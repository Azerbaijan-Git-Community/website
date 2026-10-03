import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PerksSection } from "@/components/landing/perks-section";

describe("PerksSection", () => {
  test("lists member perks, tags and support pillars", () => {
    const { container } = render(<PerksSection />);

    expect(container.querySelector("section#perks")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.querySelector("h3")?.textContent)).toEqual([
      "Tech Product Benefits",
      "Partner Discounts & Support",
      "Job Support & Development",
    ]);
    for (const tag of ["#GitHubPro", "#Codespaces", "#AI_Tools", "#DevSecOps", "#CI/CD", "#FreeHosting"]) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
    for (const pillar of ["FREE Services", "Support", "Training", "Collaboration"]) {
      expect(screen.getByText(pillar)).toBeInTheDocument();
    }
  });
});
