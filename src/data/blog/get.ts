import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { BlogPostWhereInput } from "@/generated/prisma/models";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

/** The one definition of what readers may see. Every public reader of blog posts goes through it. */
export const publicBlogPostWhere = {
  removedByAuthorAt: null,
  removedByAdminAt: null,
  sourceMissingAt: null,
  author: { banned: false, blogBanned: false },
} satisfies BlogPostWhereInput;

export type BlogPostItem = Awaited<ReturnType<typeof getBlogPosts>>[number];

export async function getBlogPosts() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.blog);

  const posts = await prisma.blogPost.findMany({
    where: publicBlogPostWhere,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      tags: true,
      coverImage: true,
      userId: true,
      readingTime: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return posts;
}

export async function getBlogPost(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.blogPost(slug));

  return prisma.blogPost.findFirst({
    where: { slug, ...publicBlogPostWhere },
    include: { author: { select: { name: true, image: true, githubUsername: true } } },
    omit: {
      sourceOrigin: true,
      sourcePostId: true,
      sourceUpdatedAt: true,
      removedByAuthorAt: true,
      removedByAdminAt: true,
      sourceMissingAt: true,
    },
  });
}

export async function getAllBlogSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.blog);

  return prisma.blogPost.findMany({
    where: publicBlogPostWhere,
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
}
