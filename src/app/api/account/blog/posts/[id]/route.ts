import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateBlogPost } from "@/lib/sync/sync-omicron";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = z.object({ visible: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Expected { visible: boolean }" }, { status: 400 });

  const { id } = await ctx.params;
  const post = await prisma.blogPost.findFirst({ where: { id, userId: session.user.id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.removedByAdminAt) {
    return NextResponse.json({ error: "An admin removed this post from the blog." }, { status: 403 });
  }

  await prisma.blogPost.update({
    where: { id },
    data: { removedByAuthorAt: body.data.visible ? null : new Date() },
  });
  revalidateBlogPost(post.slug);
  return NextResponse.json({ message: body.data.visible ? "Post shown on the blog." : "Post hidden from the blog." });
}
