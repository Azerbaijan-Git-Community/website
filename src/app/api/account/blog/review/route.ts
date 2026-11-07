import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateBlogPost } from "@/lib/sync/sync-omicron";

/** Finishes the first-connect review: the ticked posts go live, and later posts appear automatically. */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = z.object({ visibleIds: z.array(z.string()) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Expected { visibleIds: string[] }" }, { status: 400 });

  const userId = session.user.id;
  const connection = await prisma.omicronConnection.findUnique({ where: { userId } });
  if (!connection) return NextResponse.json({ error: "No connected account" }, { status: 404 });

  const where = { userId, id: { in: body.data.visibleIds }, removedByAdminAt: null };
  const posts = await prisma.blogPost.findMany({ where, select: { slug: true } });
  await prisma.$transaction([
    prisma.blogPost.updateMany({ where, data: { removedByAuthorAt: null } }),
    prisma.omicronConnection.update({ where: { userId }, data: { reviewedAt: new Date() } }),
  ]);
  for (const post of posts) revalidateBlogPost(post.slug);

  return NextResponse.json({ message: `${posts.length} posts are now on the blog.` });
}
