import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import NotFound, { metadata } from "@/app/not-found";

describe("NotFound", () => {
  test("explains the 404 and offers a way back", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("This page doesn't exist");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "View leaderboard" })).toHaveAttribute("href", "/leaderboard");
  });

  test("is not indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
