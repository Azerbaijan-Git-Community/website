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
  coverImage: "https://raw.githubusercontent.com/Azerbaijan-Git-Community/blog/main/posts/hello-world/images/cover.png",
  userId: "u1",
  readingTime: 4,
  createdAt: new Date("2026-03-05T12:00:00Z"),
  author: { name: "Aysel", image: "https://avatars.githubusercontent.com/u/1" },
};

describe("BlogPostCard", () => {
  test("links to the post", () => {
    render(<BlogPostCard post={post} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/blog/hello-world");
  });

  test("shows the title, description, author, reading time and date", () => {
    render(<BlogPostCard post={post} />);
    expect(screen.getByRole("heading", { name: "Hello World" })).toBeInTheDocument();
    expect(screen.getByText("An introduction")).toBeInTheDocument();
    expect(screen.getByText("Aysel")).toBeInTheDocument();
    expect(screen.getByText("4 min read")).toBeInTheDocument();
    expect(screen.getByText("Mar 5, 2026")).toBeInTheDocument();
  });

  test("renders the optimized cover and the raw author avatar", () => {
    render(<BlogPostCard post={post} />);
    const cover = screen.getByRole("img", { name: "Hello World" });
    expect(cover.getAttribute("src")).toMatch(/^\/_next\/image\?url=/);
    expect(screen.getByRole("img", { name: "Aysel" })).toHaveAttribute("src", post.author.image);
  });
});
