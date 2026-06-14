import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBearerToken } from "@/lib/utils.server";
import { isValidSecret } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const providedSecret = getBearerToken(req);
  if (!isValidSecret(providedSecret, process.env.AUTHOR_VALIDATE_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubId = req.nextUrl.searchParams.get("githubId");
  if (!githubId || !/^\d+$/.test(githubId)) {
    return NextResponse.json({ error: "Invalid githubId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { githubId: parseInt(githubId, 10) },
    select: { id: true, banned: true },
  });

  if (!user) {
    return NextResponse.json(
      { exists: false, message: "You need to signup in website for publishing blog post" },
      { status: 404 },
    );
  }

  if (user.banned) {
    return NextResponse.json(
      { exists: false, message: "Your account has been banned from publishing blog posts" },
      { status: 404 },
    );
  }

  return NextResponse.json({ exists: true });
}
