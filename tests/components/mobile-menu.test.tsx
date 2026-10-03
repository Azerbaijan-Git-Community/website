import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { MobileMenu } from "@/components/mobile-menu";
import { renderWithRouter } from "@test/next-router";

const drawer = () => screen.getByRole("navigation").parentElement!;

describe("MobileMenu", () => {
  test("starts closed", () => {
    renderWithRouter(<MobileMenu />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(drawer()).toHaveClass("translate-x-full");
    expect(document.body.style.overflow).toBe("");
  });

  test("opens the drawer and locks page scroll", async () => {
    const user = userEvent.setup();
    renderWithRouter(<MobileMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(drawer()).toHaveClass("translate-x-0");
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("lists every page and marks the current one", () => {
    renderWithRouter(<MobileMenu />, { pathname: "/leaderboard" });
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/", "/blog", "/leaderboard", "/showcase", "/api-docs"]);
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveClass("text-blue");
    expect(screen.getByRole("link", { name: "Blog" })).toHaveClass("text-hi");
  });

  test("closes with the toggle and restores scrolling", async () => {
    const user = userEvent.setup();
    renderWithRouter(<MobileMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(drawer()).toHaveClass("translate-x-full");
    expect(document.body.style.overflow).toBe("");
  });

  test("closes when clicking outside", async () => {
    const user = userEvent.setup();
    const outside = document.body.appendChild(document.createElement("main"));
    renderWithRouter(<MobileMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(outside);

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  test("stays open when clicking inside the drawer", async () => {
    const user = userEvent.setup();
    renderWithRouter(<MobileMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.pointer({ keys: "[MouseLeft>]", target: screen.getByRole("navigation") });

    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });

  test("unlocks scrolling if unmounted while open", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithRouter(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    unmount();

    expect(document.body.style.overflow).toBe("");
  });
});
