import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { BlogListClient } from "@/components/blog/blog-list-client";
import { getBlogAuthor, getBlogPosts } from "@/data/blog/get";

export const metadata: Metadata = {
  title: "Blog | Azerbaijan GitHub Community",
  description:
    "Articles, tutorials, and insights from Azerbaijan GitHub Community members. Learn about web development, open source, and software engineering.",
  keywords: [
    "Azerbaijan developer blog",
    "GitHub Azerbaijan articles",
    "Azerbaijan tech community blog",
    "developer tutorials Azerbaijan",
  ],
  openGraph: {
    title: "Developer Blog | Azerbaijan GitHub Community",
    description: "Articles and tutorials from Azerbaijan GitHub Community members.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Blog | Azerbaijan GitHub Community",
    description: "Articles and tutorials from Azerbaijan GitHub Community members.",
  },
};

export default async function BlogPage() {
  "use cache";
  cacheLife("weeks");
  cacheTag("blog");

  const initialData = await getBlogPosts();

  // Resolve authors for initial page
  const uniqueAuthorIds = [...new Set(initialData.items.map((p) => p.authorId))];
  const authors = await Promise.all(
    uniqueAuthorIds.map(async (id) => {
      const author = await getBlogAuthor(id);
      return [
        id,
        {
          name: author?.name ?? "Community Member",
          avatar: author?.image ?? `https://avatars.githubusercontent.com/u/${id}`,
        },
      ] as const;
    }),
  );
  const authorMap = Object.fromEntries(authors);

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            Community Blog
          </span>
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Developer <span className="text-gradient">Blog</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-lo">
            Articles and tutorials from Azerbaijan GitHub Community members.{" "}
            <a
              href="https://github.com/Azerbaijan-Git-Community/blog#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue transition-colors hover:text-lime"
            >
              Write a post
            </a>
          </p>
        </div>

        <BlogListClient initialData={initialData} authorMap={authorMap} />
      </div>
    </div>
  );
}
