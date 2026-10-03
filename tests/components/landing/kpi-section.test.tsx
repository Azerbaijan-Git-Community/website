import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { KpiSection } from "@/components/landing/kpi-section";

describe("KpiSection", () => {
  test("shows the six KPI dimensions with their measures", () => {
    render(<KpiSection />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("National KPI Framework");
    const kpis = screen.getAllByRole("heading", { level: 3 }).map((h) => [h.textContent, h.nextSibling?.textContent]);
    expect(kpis).toEqual([
      ["Activity", "Pushes, Repos"],
      ["Talent", "Training Numbers"],
      ["OSS Projects", "Public Goods"],
      ["Events", "Community reach"],
      ["Innovation", "GII Impact"],
      ["Employment", "Hirings"],
    ]);
  });
});
