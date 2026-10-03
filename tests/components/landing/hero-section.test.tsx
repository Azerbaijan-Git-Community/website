import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { HeroSection } from "@/components/landing/hero-section";
import { renderServer } from "@test/render-server";

describe("HeroSection", () => {
  test("pitches the program with calls to action and the goal tracker", async () => {
    const { container } = await renderServer(<HeroSection />);

    expect(container.querySelector("section#hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Push the future of Azerbaijan");
    expect(screen.getByRole("link", { name: "Start Contributing" })).toHaveAttribute("href", "#join");
    expect(screen.getByRole("link", { name: "View Our Goal" })).toHaveAttribute("href", "#about");
    expect(screen.getByText("National 5-Year Target")).toBeInTheDocument();
  });
});
