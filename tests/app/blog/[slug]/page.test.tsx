import { screen } from "@testing-library/react";
import { cacheTag } from "next/cache";
import { describe, expect, test } from "vitest";
import BlogPostPage, { generateMetadata, generateStaticParams } from "@/app/blog/[slug]/page";
import { createBlogPost, createUser, testPrisma } from "@test/db";
import { renderServer } from "@test/render-server";

const props = (slug: string) => ({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({}) });

async function seedPost() {
  const author = await createUser({ name: "Aysel", githubUsername: "aysel" });
  return createBlogPost(author.id, {
    slug: "hello-world",
    title: "Hello World",
    description: "An introduction",
    tags: ["intro", "community"],
    readingTime: 4,
    createdAt: new Date("2026-03-05T12:00:00Z"),
    contentHtml:
      '<h2>Getting Started</h2><p>Read the <a href="https://example.com">docs</a>.</p><p><img src="https://omicron.example/api/uploads/diagram.png" alt="diagram"></p>',
  });
}

describe("BlogPostPage", () => {
  test("renders the post header and its rendered body", async () => {
    await seedPost();

    const { container } = await renderServer(<BlogPostPage {...props("hello-world")} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello World");
    expect(screen.getByText("Aysel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "@aysel" })).toHaveAttribute("href", "https://github.com/aysel");
    expect(screen.getByText("Mar 5, 2026")).toBeInTheDocument();
    expect(screen.getByText("4 min read")).toBeInTheDocument();
    expect(container.querySelector(".prose h2#getting-started")).toHaveTextContent("Getting Started");
    expect(screen.getByRole("link", { name: "docs" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("img", { name: "diagram" })).toHaveAttribute(
      "src",
      "https://omicron.example/api/uploads/diagram.png",
    );
    expect(screen.getByRole("link", { name: "Back to blog" })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: "Comment on Omicron" })).toHaveAttribute(
      "href",
      "https://omicron.example/@author/hello-world",
    );
    expect(screen.queryByText("AI-assisted")).not.toBeInTheDocument();
  });

  test("never lets a stored body run script", async () => {
    const author = await createUser();
    await createBlogPost(author.id, {
      slug: "evil",
      contentHtml: '<p>hi</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
    });
    const { container } = await renderServer(<BlogPostPage {...props("evil")} />);
    expect(container.querySelector(".prose script")).toBeNull();
    expect(container.querySelector(".prose [onerror]")).toBeNull();
  });

  test("discloses AI assistance", async () => {
    const post = await seedPost();
    await testPrisma.blogPost.update({ where: { id: post.id }, data: { aiAssisted: true } });
    await renderServer(<BlogPostPage {...props("hello-world")} />);
    expect(screen.getByText("AI-assisted")).toBeInTheDocument();
  });

  test.each([
    ["hidden by its author", { removedByAuthorAt: new Date() }],
    ["removed by an admin", { removedByAdminAt: new Date() }],
    ["no longer on Omicron", { sourceMissingAt: new Date() }],
  ])("404s for a post %s", async (_label, removal) => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "gone", ...removal });
    await expect(renderServer(<BlogPostPage {...props("gone")} />)).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });

  test("emits BlogPosting and breadcrumb structured data", async () => {
    await seedPost();

    const { container } = await renderServer(<BlogPostPage {...props("hello-world")} />);

    const [posting, breadcrumbs] = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent,
    );
    expect(posting).toMatchObject({
      "@type": "BlogPosting",
      headline: "Hello World",
      keywords: "intro, community",
      author: { name: "Aysel", url: "https://github.com/aysel" },
    });
    expect(breadcrumbs.itemListElement.map((c: { name: string }) => c.name)).toEqual(["Home", "Blog", "Hello World"]);
  });

  test("404s for an unknown slug", async () => {
    await expect(renderServer(<BlogPostPage {...props("missing")} />)).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });

  test("is cached under the post's own tag", async () => {
    await seedPost();
    await renderServer(<BlogPostPage {...props("hello-world")} />);
    expect(cacheTag).toHaveBeenCalledWith("blog-hello-world");
  });
});

describe("generateMetadata", () => {
  test("builds article metadata from the post", async () => {
    const post = await seedPost();

    const metadata = await generateMetadata(props("hello-world"));

    expect(metadata).toEqual({
      title: "Hello World",
      description: "An introduction",
      keywords: ["intro", "community"],
      alternates: { canonical: "https://omicron.example/@author/hello-world" },
      openGraph: {
        type: "article",
        publishedTime: "2026-03-05T12:00:00.000Z",
        modifiedTime: post.updatedAt.toISOString(),
        authors: ["Aysel"],
        images: [{ url: post.coverImage, alt: "Hello World", width: 1200, height: 630 }],
      },
    });
  });

  test("returns empty metadata for an unknown slug", async () => {
    await expect(generateMetadata(props("missing"))).resolves.toEqual({});
  });
});

describe("generateStaticParams", () => {
  test("gives Next a placeholder when there are no posts, because an empty list fails the build", async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ slug: "__placeholder__" }]);
  });

  test("the placeholder is a 404, not a page", async () => {
    await expect(renderServer(<BlogPostPage {...props("__placeholder__")} />)).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });

  test("prerenders every post", async () => {
    const author = await createUser();
    await createBlogPost(author.id, { slug: "a" });
    await createBlogPost(author.id, { slug: "b" });

    const params = await generateStaticParams();

    expect(params.map((p) => p.slug).toSorted()).toEqual(["a", "b"]);
    expect(params).toHaveLength(await testPrisma.blogPost.count());
  });
});
