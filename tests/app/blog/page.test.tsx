import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import BlogPage, { metadata } from "@/app/blog/page";
import { createBlogPost, createUser } from "@test/db";
import { renderServer } from "@test/render-server";

function jsonLd(container: HTMLElement) {
  return JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent);
}

describe("BlogPage", () => {
  test("lists posts newest first as cards", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "older", title: "Older", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createBlogPost(author.id, { slug: "newer", title: "Newer", createdAt: new Date("2026-02-01T00:00:00Z") });

    await renderServer(<BlogPage />);

    const cards = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/blog/"));
    expect(cards.map((a) => a.getAttribute("href"))).toEqual(["/blog/newer", "/blog/older"]);
  });

  test("describes the listing with CollectionPage structured data", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "hello", title: "Hello" });

    const { container } = await renderServer(<BlogPage />);

    expect(jsonLd(container)).toMatchObject({
      "@type": "CollectionPage",
      url: "http://localhost:3000/blog",
      mainEntity: {
        numberOfItems: 1,
        itemListElement: [{ position: 1, name: "Hello", url: "http://localhost:3000/blog/hello" }],
      },
    });
  });

  test("invites contributions when there are no posts", async () => {
    await renderServer(<BlogPage />);
    expect(screen.getByText("No blog posts yet. Be the first to contribute!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Write a post" })).toHaveAttribute(
      "href",
      "https://github.com/Azerbaijan-Git-Community/blog#readme",
    );
  });

  test("declares its title and canonical URL", () => {
    expect(metadata).toMatchObject({ title: "Blog", alternates: { canonical: "http://localhost:3000/blog" } });
  });
});
