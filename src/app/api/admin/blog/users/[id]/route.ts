import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateBlogPost } from "@/lib/sync/sync-omicron";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  action: z.enum(["blog-ban", "blog-unban", "ban", "unban"]),
  reason: z.string().trim().max(500).optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = BodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "admin") return NextResponse.json({ error: "Admins can't be banned here." }, { status: 403 });

  const { action, reason } = body.data;
  if (action === "ban") {
    await auth.api.banUser({
      headers: req.headers,
      body: { userId: id, banReason: reason || "Banned by a community admin." },
    });
  } else if (action === "unban") {
    await auth.api.unbanUser({ headers: req.headers, body: { userId: id } });
  } else {
    const blogBanned = action === "blog-ban";
    await prisma.user.update({
      where: { id },
      data: { blogBanned, blogBanReason: blogBanned ? (reason ?? null) : null },
    });
  }

  const posts = await prisma.blogPost.findMany({ where: { userId: id }, select: { slug: true } });
  for (const post of posts) revalidateBlogPost(post.slug);

  const messages = {
    ban: "User banned from the site.",
    unban: "User unbanned.",
    "blog-ban": "User banned from the blog.",
    "blog-unban": "User can post on the blog again.",
  };
  return NextResponse.json({ message: messages[action] });
}
