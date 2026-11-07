import "server-only";
import { revalidateTag } from "next/cache";
import type { OmicronConnection } from "@/generated/prisma/client";
import { cacheTags } from "@/lib/cache-tags";
import { clientEnv } from "@/lib/env.client";
import { fetchOmicronAuthorPosts, fetchOmicronPost, type OmicronPost } from "@/lib/omicron";
import { prisma } from "@/lib/prisma";
import { prepareImportedHtml } from "@/lib/render-post-html";

const MAX_PAGES = 200;
const DESCRIPTION_LENGTH = 160;
const WORDS_PER_MINUTE = 200;

type Connection = Pick<OmicronConnection, "userId" | "origin" | "username" | "reviewedAt">;

/** Hidden content must be gone on the next request, not after one more stale view. */
export function revalidateBlogPost(slug: string) {
  revalidateTag(cacheTags.blogPost(slug), { expire: 0 });
  revalidateTag(cacheTags.blog, { expire: 0 });
}

const isImportable = (post: OmicronPost, connection: Connection) =>
  !post.remote && post.status === "published" && post.title !== null && post.author.username === connection.username;

async function uniqueSlug(post: OmicronPost, connection: Connection) {
  const slug = `${connection.username}-${post.slug ?? post.id}`;
  const taken = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
  return taken ? `${slug}-${post.id.slice(0, 8)}` : slug;
}

function coverOf(post: OmicronPost, origin: string) {
  try {
    const url = new URL(post.bannerUrl ?? "", origin);
    if (post.bannerUrl && url.protocol === "https:") return url.toString();
  } catch {
    // Not a usable URL, so the default cover stands in.
  }
  return new URL("/azgit_1024_white.png", clientEnv.NEXT_PUBLIC_BASE_URL).toString();
}

/** Writes a post, leaving the removal fields alone so a sync can never restore what someone hid. */
async function upsertPost(post: OmicronPost, connection: Connection): Promise<string | null> {
  const key = { sourceOrigin: connection.origin, sourcePostId: post.id };
  const existing = await prisma.blogPost.findUnique({
    where: { sourceOrigin_sourcePostId: key },
    select: { slug: true, sourceUpdatedAt: true, sourceMissingAt: true },
  });
  if (existing && !existing.sourceMissingAt && existing.sourceUpdatedAt.getTime() === post.updatedAt.getTime()) {
    return null;
  }

  const { html, text, excerpt } = await prepareImportedHtml(post.contentHtml, connection.origin);
  const fields = {
    title: post.title ?? "",
    description: post.summary?.trim() || excerpt.slice(0, DESCRIPTION_LENGTH),
    tags: post.tags.map((tag) => tag.name),
    coverImage: coverOf(post, connection.origin),
    userId: connection.userId,
    contentHtml: html,
    readingTime: Math.max(1, Math.ceil(text.split(" ").filter(Boolean).length / WORDS_PER_MINUTE)),
    sourceUrl: new URL(`/@${connection.username}/${post.slug ?? post.id}`, connection.origin).toString(),
    sourceUpdatedAt: post.updatedAt,
    aiAssisted: post.aiAssisted,
    sourceMissingAt: null,
  };

  if (existing) {
    await prisma.blogPost.update({ where: { sourceOrigin_sourcePostId: key }, data: fields });
    return existing.slug;
  }
  const slug = await uniqueSlug(post, connection);
  await prisma.blogPost.create({
    data: {
      ...fields,
      ...key,
      slug,
      createdAt: post.createdAt,
      // Nothing goes live until the member has been through the review list.
      removedByAuthorAt: connection.reviewedAt ? null : new Date(),
    },
  });
  return slug;
}

async function markMissing(origin: string, postIds: { sourcePostId: string; slug: string }[]) {
  if (postIds.length === 0) return;
  await prisma.blogPost.updateMany({
    where: { sourceOrigin: origin, sourcePostId: { in: postIds.map((post) => post.sourcePostId) } },
    data: { sourceMissingAt: new Date() },
  });
  for (const post of postIds) revalidateBlogPost(post.slug);
}

/** Brings one post up to date. A request failure throws and changes nothing, so the sender retries. */
export async function syncPost(connection: Connection, postId: string) {
  const post = await fetchOmicronPost(connection.origin, postId);
  if (post && isImportable(post, connection)) {
    const slug = await upsertPost(post, connection);
    if (slug) revalidateBlogPost(slug);
    return;
  }
  const stored = await prisma.blogPost.findFirst({
    where: { sourceOrigin: connection.origin, sourcePostId: postId, userId: connection.userId, sourceMissingAt: null },
    select: { sourcePostId: true, slug: true },
  });
  if (stored) await markMissing(connection.origin, [stored]);
}

/**
 * Compares everything stored with the author's public listing. This is what notices a suspended,
 * deleted or now-private author: their single-post reads can still succeed, but the listing drops them.
 */
export async function reconcileAccount(connection: Connection) {
  const seen = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchOmicronAuthorPosts(connection.origin, connection.username, cursor);
    for (const post of result?.items ?? []) {
      if (!isImportable(post, connection)) continue;
      seen.add(post.id);
      const slug = await upsertPost(post, connection);
      if (slug) revalidateBlogPost(slug);
    }
    cursor = result?.nextCursor ?? null;
    if (!cursor) break;
  }

  // A listing cut off by the page cap proves nothing about the posts past it.
  if (cursor) return;
  const stored = await prisma.blogPost.findMany({
    where: { sourceOrigin: connection.origin, userId: connection.userId, sourceMissingAt: null },
    select: { sourcePostId: true, slug: true },
  });
  await markMissing(
    connection.origin,
    stored.filter((post) => !seen.has(post.sourcePostId)),
  );
  await prisma.omicronConnection.update({ where: { userId: connection.userId }, data: { lastSyncedAt: new Date() } });
}

export async function reconcileAllAccounts() {
  const connections = await prisma.omicronConnection.findMany({ where: { subscriptionId: { not: null } } });
  const failed: string[] = [];
  for (const connection of connections) {
    try {
      await reconcileAccount(connection);
    } catch (error) {
      console.warn(`[omicron] reconcile failed for ${connection.username}:`, error);
      failed.push(connection.username);
    }
  }
  return { synced: connections.length - failed.length, failed };
}

/**
 * Ends a connection. Admin-removed rows stay, so reconnecting can't restore them. A banned member keeps
 * the link itself, so their Omicron account can't move to another GitHub login, but it stops receiving.
 */
export async function disconnectOmicron(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true, blogBanned: true } });
  const posts = await prisma.blogPost.findMany({ where: { userId }, select: { slug: true } });
  if (user?.banned || user?.blogBanned) {
    await prisma.omicronConnection.updateMany({
      where: { userId },
      data: { subscriptionId: null, webhookSecret: null },
    });
    return;
  }
  await prisma.blogPost.deleteMany({ where: { userId, removedByAdminAt: null } });
  await prisma.omicronConnection.deleteMany({ where: { userId } });
  for (const post of posts) revalidateBlogPost(post.slug);
}
