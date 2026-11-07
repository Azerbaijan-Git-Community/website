import "server-only";
import { prisma } from "@/lib/prisma";

// Uncached on purpose: these screens must show the result of the action just taken.

const MODERATION_LIMIT = 200;

export async function getMemberBlog(userId: string) {
  const [connection, user, posts] = await Promise.all([
    prisma.omicronConnection.findUnique({
      where: { userId },
      select: { username: true, origin: true, reviewedAt: true, subscriptionId: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { blogBanned: true, blogBanReason: true } }),
    prisma.blogPost.findMany({
      where: { userId },
      select: {
        id: true,
        slug: true,
        title: true,
        createdAt: true,
        sourceUrl: true,
        removedByAuthorAt: true,
        removedByAdminAt: true,
        sourceMissingAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { connection, blogBanned: user?.blogBanned ?? false, blogBanReason: user?.blogBanReason ?? null, posts };
}

export type MemberBlogPost = Awaited<ReturnType<typeof getMemberBlog>>["posts"][number];

export function getModerationPosts() {
  return prisma.blogPost.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      createdAt: true,
      sourceUrl: true,
      removedByAdminAt: true,
      removedByAuthorAt: true,
      author: {
        select: { id: true, name: true, githubUsername: true, role: true, banned: true, blogBanned: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: MODERATION_LIMIT,
  });
}

export type ModerationPost = Awaited<ReturnType<typeof getModerationPosts>>[number];
