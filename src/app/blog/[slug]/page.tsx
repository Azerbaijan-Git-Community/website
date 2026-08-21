import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PiArrowLeft, PiCalendar } from "react-icons/pi";
import { mdxComponents } from "@/components/blog/mdx-components";
import { ReadingTimeBadge } from "@/components/blog/reading-time-badge";
import { JsonLd } from "@/components/json-ld";
import { getAllBlogSlugs, getBlogPost } from "@/data/blog/get";
import { cacheTags } from "@/lib/cache-tags";
import { compileMdx } from "@/lib/compile-mdx";
import { clientEnv } from "@/lib/env.client";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils.client";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  "use cache";
  cacheLife("max");

  const { slug } = await params;
  cacheTag(cacheTags.blogPost(slug));
  const post = await getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `${clientEnv.NEXT_PUBLIC_BASE_URL}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      images: [{ url: post.coverImage, alt: post.title, width: 1200, height: 630 }],
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  "use cache";
  cacheLife("max");

  const { slug } = await params;
  cacheTag(cacheTags.blogPost(slug));
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const MDXContent = await compileMdx(post.contentMdx, post.slug);

  return (
    <div className="min-h-svh pt-32 pb-24">
      <JsonLd
        data={[
          blogPostingSchema(post),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <article className="mx-auto max-w-200 px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-lo transition-colors hover:text-hi"
        >
          <PiArrowLeft size={16} />
          Back to blog
        </Link>

        {/* Cover image */}
        <div className="relative mb-8 aspect-2/1 w-full overflow-hidden rounded-xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
            quality={100}
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        {/* Post header */}
        <header className="mb-10">
          <h1 className="mb-4 font-outfit text-[clamp(2rem,4vw,3rem)] leading-tight font-bold text-hi">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Author */}
            <div className="flex items-center gap-2">
              <Image
                src={post.author.image}
                alt={post.author.name}
                width={32}
                height={32}
                className="rounded-full"
                unoptimized
              />
              <div>
                <span className="text-hi">{post.author.name}</span>
                {post.author.githubUsername && (
                  <a
                    href={`https://github.com/${post.author.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-dim transition-colors hover:text-blue"
                  >
                    @{post.author.githubUsername}
                  </a>
                )}
              </div>
            </div>

            <span className="text-line">|</span>

            {/* Date */}
            <span className="inline-flex items-center gap-1.5 text-dim">
              <PiCalendar size={16} />
              {formatDate(post.createdAt)}
            </span>

            <span className="text-line">|</span>

            {/* Reading time */}
            <ReadingTimeBadge minutes={post.readingTime} />
          </div>
        </header>

        {/* MDX content */}
        <div className="prose prose-lg max-w-none prose-invert">
          <MDXContent components={mdxComponents} />
        </div>
      </article>
    </div>
  );
}
