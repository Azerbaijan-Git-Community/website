import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Navbar } from "@/components/navbar";
import { sessionHeadersFor } from "@test/auth";
import { createUser } from "@test/db";
import { incomingRequest } from "@test/next-headers";
import { renderServer } from "@test/render-server";

vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

beforeEach(() => {
  incomingRequest.headers = new Headers();
});

describe("Navbar", () => {
  test("links the logo home and lists every page", async () => {
    await renderServer(<Navbar />);

    expect(screen.getByRole("img", { name: "GitHub Azerbaijan" }).closest("a")).toHaveAttribute("href", "/");
    const desktopLinks = screen
      .getAllByRole("link")
      .filter((a) => a.closest(".md\\:flex"))
      .map((a) => [a.textContent, a.getAttribute("href")]);
    expect(desktopLinks).toEqual([
      ["Home", "/"],
      ["Blog", "/blog"],
      ["Leaderboard", "/leaderboard"],
      ["Showcase", "/showcase"],
      ["API Docs", "/api-docs"],
    ]);
  });

  test("offers sign-in to anonymous visitors", async () => {
    await renderServer(<Navbar />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "User menu" })).not.toBeInTheDocument();
  });

  test("shows the user menu when signed in", async () => {
    const user = await createUser({ name: "Aysel" });
    incomingRequest.headers = await sessionHeadersFor(user.id);

    await renderServer(<Navbar />);

    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });

  test("includes the mobile menu toggle", async () => {
    await renderServer(<Navbar />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });
});
