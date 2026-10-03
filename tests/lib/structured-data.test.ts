import { describe, expect, test } from "vitest";
import {
  blogPostingSchema,
  breadcrumbSchema,
  collectionPageSchema,
  organizationSchema,
  websiteSchema,
} from "@/lib/structured-data";

const BASE = "http://localhost:3000";

describe("organizationSchema", () => {
  test("describes the community organization", () => {
    expect(organizationSchema()).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Azerbaijan GitHub Community",
      url: BASE,
      description: expect.any(String),
      logo: `${BASE}/logo.png`,
      sameAs: ["https://github.com/Azerbaijan-Git-Community"],
    });
  });
});

describe("websiteSchema", () => {
  test("embeds the organization as publisher", () => {
    expect(websiteSchema()).toMatchObject({
      "@type": "WebSite",
      url: BASE,
      publisher: { "@type": "Organization", logo: { "@type": "ImageObject", url: `${BASE}/logo.png` } },
    });
  });
});

describe("collectionPageSchema", () => {
  test("numbers list items from 1 and resolves the page URL", () => {
    const schema = collectionPageSchema({
      name: "Blog",
      description: "Posts",
      path: "/blog",
      items: [
        { name: "First", url: `${BASE}/blog/first` },
        { name: "Second", url: `${BASE}/blog/second` },
      ],
    });

    expect(schema.url).toBe(`${BASE}/blog`);
    expect(schema.mainEntity).toEqual({
      "@type": "ItemList",
      numberOfItems: 2,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "First", url: `${BASE}/blog/first` },
        { "@type": "ListItem", position: 2, name: "Second", url: `${BASE}/blog/second` },
      ],
    });
  });

  test("handles an empty list", () => {
    const schema = collectionPageSchema({ name: "Showcase", description: "", path: "/showcase", items: [] });
    expect(schema.mainEntity).toEqual({ "@type": "ItemList", numberOfItems: 0, itemListElement: [] });
  });
});

describe("blogPostingSchema", () => {
  const post = {
    slug: "hello",
    title: "Hello",
    description: "Intro",
    coverImage: "https://example.com/cover.png",
    tags: ["react", "next"],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
    author: { name: "Aysel", githubUsername: "aysel" },
  };

  test("maps a post to a BlogPosting", () => {
    expect(blogPostingSchema(post)).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Hello",
      description: "Intro",
      image: "https://example.com/cover.png",
      datePublished: "2026-01-01T00:00:00.000Z",
      dateModified: "2026-02-01T00:00:00.000Z",
      keywords: "react, next",
      author: { "@type": "Person", name: "Aysel", url: "https://github.com/aysel" },
      publisher: expect.objectContaining({ "@type": "Organization" }),
      mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/blog/hello` },
      url: `${BASE}/blog/hello`,
    });
  });

  test("omits the author URL when there is no GitHub username", () => {
    const schema = blogPostingSchema({ ...post, author: { name: "Anon", githubUsername: null } });
    expect(schema.author).toEqual({ "@type": "Person", name: "Anon" });
  });
});

describe("breadcrumbSchema", () => {
  test("builds absolute crumb URLs in order", () => {
    expect(
      breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
      ],
    });
  });
});
