import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { DocsSidebar } from "@/components/api-docs/docs-sidebar";
import { ALL_SECTION_IDS } from "@/components/api-docs/endpoints";
import { FakeIntersectionObserver } from "@test/intersection-observer";

function renderWithSections() {
  for (const id of ALL_SECTION_IDS) {
    const section = document.createElement("section");
    section.id = id;
    document.body.append(section);
  }
  return render(<DocsSidebar />);
}

const active = () => document.querySelector("a.text-blue")?.textContent;

describe("DocsSidebar", () => {
  test("lists every section under its group, starting on the introduction", () => {
    renderWithSections();

    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getByText("Endpoints")).toBeInTheDocument();
    expect(screen.getByText("Reference")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(ALL_SECTION_IDS.length);
    expect(screen.getByRole("link", { name: "/leaderboard/{year}/{month}" })).toHaveAttribute(
      "href",
      "#leaderboard-month",
    );
    expect(active()).toBe("Introduction");
  });

  test("observes every section with an offset for the fixed navbar", () => {
    renderWithSections();
    const [observer] = FakeIntersectionObserver.instances;
    expect(observer.rootMargin).toBe("-100px 0px -70% 0px");
    expect(observer.observed.size).toBe(ALL_SECTION_IDS.length);
  });

  test("highlights the first visible section while scrolling", () => {
    renderWithSections();

    act(() =>
      FakeIntersectionObserver.emitAll([
        { target: document.getElementById("rate-limits")!, isIntersecting: true },
        { target: document.getElementById("caching")!, isIntersecting: true },
      ]),
    );
    expect(active()).toBe("Rate limits");

    act(() =>
      FakeIntersectionObserver.emitAll([{ target: document.getElementById("rate-limits")!, isIntersecting: false }]),
    );
    expect(active()).toBe("Caching");
  });

  test("smooth-scrolls to a section below the navbar and updates the hash", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderWithSections();
    vi.spyOn(document.getElementById("errors")!, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 900));

    await user.click(screen.getByRole("link", { name: "Errors" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 800, behavior: "smooth" });
    expect(window.location.hash).toBe("#errors");
    expect(active()).toBe("Errors");
  });

  test("disconnects the observer on unmount", () => {
    const { unmount } = renderWithSections();
    const [observer] = FakeIntersectionObserver.instances;
    unmount();
    expect(observer.observed.size).toBe(0);
  });
});
