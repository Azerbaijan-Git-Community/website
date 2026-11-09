import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { NavLinks } from "@/components/nav-links";
import { NextRouterProvider, renderWithRouter } from "@test/next-router";

const at = (pathname: string) => (
  <NextRouterProvider pathname={pathname}>
    <NavLinks />
  </NextRouterProvider>
);

const current = () => screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");

describe("NavLinks", () => {
  test("marks the current page", () => {
    renderWithRouter(<NavLinks />, { pathname: "/leaderboard" });
    expect(current().map((a) => a.textContent)).toEqual(["Leaderboard"]);
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveClass("text-hi");
    expect(screen.getByRole("link", { name: "Blog" })).toHaveClass("text-lo");
  });

  test("keeps a section active on its nested pages", () => {
    renderWithRouter(<NavLinks />, { pathname: "/blog/some-post" });
    expect(current().map((a) => a.textContent)).toEqual(["Blog"]);
  });

  test("marks Home only on the root path", () => {
    renderWithRouter(<NavLinks />, { pathname: "/" });
    expect(current().map((a) => a.textContent)).toEqual(["Home"]);
  });

  test("marks nothing on pages outside the navigation", () => {
    renderWithRouter(<NavLinks />, { pathname: "/account" });
    expect(current()).toEqual([]);
  });

  test("moves the active state on click before the route changes", async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavLinks />, { pathname: "/" });

    await user.click(screen.getByRole("link", { name: "Showcase" }));

    expect(current().map((a) => a.textContent)).toEqual(["Showcase"]);
  });

  test("follows the pathname once navigation lands elsewhere", async () => {
    const user = userEvent.setup();
    const { rerender } = render(at("/"));
    await user.click(screen.getByRole("link", { name: "Showcase" }));

    rerender(at("/api-docs"));

    expect(current().map((a) => a.textContent)).toEqual(["API Docs"]);
  });
});
