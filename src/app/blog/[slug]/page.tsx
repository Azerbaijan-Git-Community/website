import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PiArrowLeft, PiCalendar } from "react-icons/pi";
import { mdxComponents } from "@/components/blog/mdx-components";
import { ReadingTimeBadge } from "@/components/blog/reading-time-badge";
import { getAllBlogSlugs, getBlogAuthor, getBlogPost } from "@/data/blog/get";
import { compileMdx } from "@/lib/compile-mdx";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  "use cache";
  cacheLife("weeks");
  cacheTag("blog");

  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Azerbaijan GitHub Community Blog`,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Strips the frontmatter block from raw MDX so only the content body is compiled.
 */
function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

export default async function BlogPostPage({ params }: { params: Params }) {
  "use cache";
  cacheLife("weeks");
  cacheTag("blog");

  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const author = await getBlogAuthor(post.authorId);
  const authorName = author?.name ?? "Community Member";
  const authorAvatar = author?.image ?? `https://avatars.githubusercontent.com/u/${post.authorId}`;
  const authorUsername = author?.githubUsername;

  const contentBody = stripFrontmatter(post.contentMdx);
  const MDXContent = await compileMdx(contentBody, post.slug);

  return (
    <div className="min-h-screen pt-32 pb-24">
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
        <div className="relative mb-8 aspect-2/1 w-full overflow-hidden rounded-xl bg-overlay">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 800px) 100vw, 800px"
            className="object-cover"
            priority
          />
        </div>

        {/* Post header */}
        <header className="mb-10">
          <h1 className="mb-4 font-outfit text-[clamp(2rem,4vw,3rem)] leading-tight font-bold text-hi">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Author */}
            <div className="flex items-center gap-2">
              <Image src={authorAvatar} alt={authorName} width={32} height={32} className="rounded-full" />
              <div>
                <span className="text-hi">{authorName}</span>
                {authorUsername && (
                  <a
                    href={`https://github.com/${authorUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-dim transition-colors hover:text-blue"
                  >
                    @{authorUsername}
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
