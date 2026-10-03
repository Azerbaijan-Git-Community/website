import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ShowcasePage, { metadata } from "@/app/showcase/page";
import { createShowcaseProject } from "@test/db";
import { renderServer } from "@test/render-server";

describe("ShowcasePage", () => {
  test("lists projects newest first with a pluralized count", async () => {
    await createShowcaseProject({ repo: "acme/older", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createShowcaseProject({ repo: "acme/newer", createdAt: new Date("2026-02-01T00:00:00Z") });

    await renderServer(<ShowcasePage />);

    expect(screen.getByText(/^2 projects built by Azerbaijan GitHub Community members\./)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["newer", "older"]);
  });

  test("uses the singular for one project", async () => {
    await createShowcaseProject({ repo: "acme/solo" });
    await renderServer(<ShowcasePage />);
    expect(screen.getByText(/^1 project built by/)).toBeInTheDocument();
  });

  test("links projects in the structured data to their repositories", async () => {
    await createShowcaseProject({ repo: "acme/rocket" });

    const { container } = await renderServer(<ShowcasePage />);

    const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent);
    expect(schema.mainEntity.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "acme/rocket", url: "https://github.com/acme/rocket" },
    ]);
  });

  test("shows an empty state that invites submissions", async () => {
    await renderServer(<ShowcasePage />);
    expect(screen.getByText("No projects yet.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Submit your project" })).toHaveLength(2);
  });

  test("declares its title and canonical URL", () => {
    expect(metadata).toMatchObject({ title: "Showcase", alternates: { canonical: "http://localhost:3000/showcase" } });
  });
});
