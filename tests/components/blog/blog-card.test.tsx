import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { BlogPostCard } from "@/components/blog/blog-card";
import type { BlogPostItem } from "@/data/blog/get";

const post: BlogPostItem = {
  id: "p1",
  slug: "hello-world",
  title: "Hello World",
  description: "An introduction",
  tags: ["intro"],
  coverImage: "https://cdn.example/cover.png",
  userId: "u1",
  readingTime: 4,
  createdAt: new Date("2026-03-05T12:00:00Z"),
  author: { name: "Aysel", image: "https://avatars.githubusercontent.com/u/1" },
};

const cover = () => screen.getByRole("img", { name: "Hello World" });

describe("BlogPostCard", () => {
  test("links to the post", () => {
    render(<BlogPostCard post={post} index={0} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/blog/hello-world");
  });

  test("shows the title, description, author, reading time and date", () => {
    render(<BlogPostCard post={post} index={0} />);
    expect(screen.getByRole("heading", { name: "Hello World" })).toBeInTheDocument();
    expect(screen.getByText("An introduction")).toBeInTheDocument();
    expect(screen.getByText("Aysel")).toBeInTheDocument();
    expect(screen.getByText("4 min read")).toBeInTheDocument();
    expect(screen.getByText("Mar 5, 2026")).toBeInTheDocument();
  });

  test("renders the cover as-is, since it can be on any host, and a GitHub-resized author avatar", () => {
    render(<BlogPostCard post={post} index={0} />);
    expect(cover()).toHaveAttribute("src", "https://cdn.example/cover.png");
    expect(screen.getByRole("img", { name: "Aysel" })).toHaveAttribute("src", `${post.author.image}?s=48`);
  });

  test("loads the first row's covers eagerly and fetches the first, the page's LCP, at high priority", () => {
    const { rerender } = render(<BlogPostCard post={post} index={0} />);
    expect(cover()).toHaveAttribute("loading", "eager");
    expect(cover()).toHaveAttribute("fetchpriority", "high");

    rerender(<BlogPostCard post={post} index={2} />);
    expect(cover()).toHaveAttribute("loading", "eager");
    expect(cover()).not.toHaveAttribute("fetchpriority");

    rerender(<BlogPostCard post={post} index={3} />);
    expect(cover()).toHaveAttribute("loading", "lazy");
  });
});
