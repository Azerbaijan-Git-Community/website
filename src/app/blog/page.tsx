import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { BlogPostCard } from "@/components/blog/blog-card";
import { BlogConnectCta } from "@/components/blog/blog-connect-cta";
import { JsonLd } from "@/components/json-ld";
import { getBlogPosts } from "@/data/blog/get";
import { cacheTags } from "@/lib/cache-tags";
import { clientEnv } from "@/lib/env.client";
import { collectionPageSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles, tutorials, and insights from Azerbaijan GitHub Community members. Learn about web development, open source, and software engineering.",
  alternates: { canonical: `${clientEnv.NEXT_PUBLIC_BASE_URL}/blog` },
};

async function BlogListing() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.blog);

  const blogPosts = await getBlogPosts();

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: "Developer Blog",
          description:
            "Articles, tutorials, and insights from Azerbaijan GitHub Community members. Learn about web development, open source, and software engineering.",
          path: "/blog",
          items: blogPosts.map((post) => ({
            name: post.title,
            url: `${clientEnv.NEXT_PUBLIC_BASE_URL}/blog/${post.slug}`,
          })),
        })}
      />
      {blogPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-lo">No blog posts yet. Be the first to contribute!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => {
            return <BlogPostCard key={post.id} post={post} />;
          })}
        </div>
      )}
    </>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-svh pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        <div className="relative mb-12 text-center">
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Developer <span className="text-gradient">Blog</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-lo">
            Articles and tutorials from Azerbaijan GitHub Community members.
          </p>
          {/* The rest of the page is cached for everyone; only this depends on who's asking. */}
          <div className="mt-6 flex justify-center empty:hidden sm:absolute sm:top-0 sm:right-0 sm:mt-0">
            <Suspense fallback={null}>
              <BlogConnectCta />
            </Suspense>
          </div>
        </div>

        <BlogListing />
      </div>
    </div>
  );
}
