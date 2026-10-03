import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import HomePage, { metadata } from "@/app/page";
import { renderServer } from "@test/render-server";

describe("HomePage", () => {
  test("stacks the landing sections in order", async () => {
    const { container } = await renderServer(<HomePage />);
    const ids = [...container.querySelectorAll("section")].map((s) => s.id);
    expect(ids).toEqual(["hero", "about", "impact", "perks", "", "roadmap", "join"]);
  });

  test("anchors the hero's calls to action to sections on the page", async () => {
    const { container } = await renderServer(<HomePage />);
    for (const name of ["Start Contributing", "View Our Goal"]) {
      const target = screen.getByRole("link", { name }).getAttribute("href")!.slice(1);
      expect(container.querySelector(`section#${target}`)).toBeInTheDocument();
    }
  });

  test("declares the canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000");
  });
});
