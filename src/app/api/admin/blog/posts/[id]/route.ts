import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateBlogPost } from "@/lib/sync/sync-omicron";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = z.object({ removed: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Expected { removed: boolean }" }, { status: 400 });

  const { id } = await ctx.params;
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await prisma.blogPost.update({ where: { id }, data: { removedByAdminAt: body.data.removed ? new Date() : null } });
  revalidateBlogPost(post.slug);
  return NextResponse.json({ message: body.data.removed ? "Post removed from the blog." : "Post restored." });
}
