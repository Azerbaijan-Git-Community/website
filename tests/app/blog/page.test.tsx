import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import BlogPage, { metadata } from "@/app/blog/page";
import { sessionHeadersFor } from "@test/auth";
import { createBlogPost, createOmicronConnection, createUser } from "@test/db";
import { incomingRequest } from "@test/next-headers";
import { renderServer } from "@test/render-server";

vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

beforeEach(() => {
  incomingRequest.headers = new Headers();
});

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
  });

  test("shows only what readers may see", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "visible" });
    await createBlogPost(author.id, { slug: "hidden", removedByAuthorAt: new Date() });
    await createBlogPost(author.id, { slug: "removed", removedByAdminAt: new Date() });
    await createBlogPost(author.id, { slug: "missing", sourceMissingAt: new Date() });
    await createBlogPost((await createUser({ banned: true })).id, { slug: "banned" });
    await createBlogPost((await createUser({ blogBanned: true })).id, { slug: "blog-banned" });

    await renderServer(<BlogPage />);

    const cards = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/blog/"));
    expect(cards.map((a) => a.getAttribute("href"))).toEqual(["/blog/visible"]);
  });

  test("offers visitors sign-in", async () => {
    await renderServer(<BlogPage />);
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  test("offers a signed-in member the Omicron connection", async () => {
    incomingRequest.headers = await sessionHeadersFor((await createUser()).id);
    await renderServer(<BlogPage />);
    expect(await screen.findByRole("link", { name: "Connect Omicron" })).toHaveAttribute(
      "href",
      "/api/omicron/connect",
    );
  });

  test("sends a connected member to their posts", async () => {
    const user = await createUser();
    await createOmicronConnection(user.id);
    incomingRequest.headers = await sessionHeadersFor(user.id);
    await renderServer(<BlogPage />);
    expect(await screen.findByRole("link", { name: "Manage my posts" })).toHaveAttribute("href", "/account/blog");
  });

  test("declares its title and canonical URL", () => {
    expect(metadata).toMatchObject({ title: "Blog", alternates: { canonical: "http://localhost:3000/blog" } });
  });
});
