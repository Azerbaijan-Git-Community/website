import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SmoothLink } from "@/components/smooth-link";
import { renderWithRouter } from "@test/next-router";

function addSection(id: string, top: number) {
  const section = document.body.appendChild(document.createElement("section"));
  section.id = id;
  vi.spyOn(section, "getBoundingClientRect").mockReturnValue(new DOMRect(0, top));
}

let scrollTo: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState(null, "", "/");
});

describe("SmoothLink", () => {
  test("smooth-scrolls to an anchor on the same page, below the navbar, and updates the URL", async () => {
    const user = userEvent.setup();
    addSection("join", 1200);
    const onClick = vi.fn<() => void>();
    renderWithRouter(
      <SmoothLink href="#join" onClick={onClick}>
        Join
      </SmoothLink>,
    );

    await user.click(screen.getByRole("link", { name: "Join" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 1130, behavior: "smooth" });
    expect(window.location.hash).toBe("#join");
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("honors a custom scroll offset", async () => {
    const user = userEvent.setup();
    addSection("perks", 500);
    renderWithRouter(
      <SmoothLink href="/#perks" scrollOffset={100}>
        Perks
      </SmoothLink>,
    );

    await user.click(screen.getByRole("link", { name: "Perks" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 400, behavior: "smooth" });
  });

  test("scrolls to the top when linking to the current page", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SmoothLink href="/">Home</SmoothLink>);

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  test("still updates the URL when the anchor is missing", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SmoothLink href="#nowhere">Nowhere</SmoothLink>);

    await user.click(screen.getByRole("link", { name: "Nowhere" }));

    expect(scrollTo).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#nowhere");
  });

  test("leaves links to other pages to the router", async () => {
    const user = userEvent.setup();
    let defaultPrevented: boolean | undefined;
    renderWithRouter(
      <SmoothLink
        href="/blog#latest"
        onClick={(e) => {
          defaultPrevented = e.defaultPrevented;
          e.preventDefault(); // stop jsdom from navigating
        }}
      >
        Blog
      </SmoothLink>,
    );

    await user.click(screen.getByRole("link", { name: "Blog" }));

    expect(defaultPrevented).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("scrolls to the URL's hash after arriving from another page", () => {
    addSection("roadmap", 900);
    window.history.replaceState(null, "", "/#roadmap");

    renderWithRouter(<SmoothLink href="/#roadmap">Roadmap</SmoothLink>);

    expect(scrollTo).toHaveBeenCalledWith({ top: 830, behavior: "smooth" });
  });
});
