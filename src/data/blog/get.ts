import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

export type BlogPostItem = Awaited<ReturnType<typeof getBlogPosts>>[number];

export async function getBlogPosts() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.blog);

  const posts = await prisma.blogPost.findMany({
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

  return prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { name: true, image: true, githubUsername: true } } },
    omit: { contentSha: true },
  });
}

export async function getAllBlogSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.blog);

  return prisma.blogPost.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
}
