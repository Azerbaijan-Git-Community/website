"use server";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Blog post metadata for list pages (excludes raw MDX content). */
export type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  coverImage: string;
  authorId: number;
  readingTime: number;
  createdAt: Date;
};

/** Paginated blog post list response. */
export type BlogPostListResponse = {
  items: BlogPostListItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

/** Fetch a paginated list of blog posts (metadata only, no content). */
export async function getBlogPosts(cursor?: string, limit = 12): Promise<BlogPostListResponse> {
  "use cache";
  cacheLife("weeks");
  cacheTag("blog");

  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      tags: true,
      coverImage: true,
      authorId: true,
      readingTime: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/** Fetch a single blog post by slug (includes full MDX content). */
export async function getBlogPost(slug: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("blog");

  return prisma.blogPost.findUnique({ where: { slug } });
}

/** Fetch all blog post slugs for sitemap and generateStaticParams. */
export async function getAllBlogSlugs() {
  "use cache";
  cacheLife("weeks");
  cacheTag("blog");

  return prisma.blogPost.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Resolve a blog post author from the User table by githubId. */
export async function getBlogAuthor(githubId: number) {
  "use cache";
  cacheLife("weeks");
  cacheTag("blog");

  return prisma.user.findFirst({
    where: { githubId },
    select: { name: true, image: true, githubUsername: true },
  });
}
