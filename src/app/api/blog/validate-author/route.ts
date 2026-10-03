import { type NextRequest, NextResponse } from "next/server";
import { isValidSecret } from "@/lib/crypto";
import { serverEnv } from "@/lib/env.server";
import { prisma } from "@/lib/prisma";
import { getBearerToken } from "@/lib/utils.server";

const INT4_MAX = 2_147_483_647;

export async function GET(req: NextRequest) {
  const providedSecret = getBearerToken(req);
  if (!isValidSecret(providedSecret, serverEnv.AUTHOR_VALIDATE_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubId = req.nextUrl.searchParams.get("githubId");
  if (!githubId || !/^\d+$/.test(githubId)) {
    return NextResponse.json({ error: "Invalid githubId" }, { status: 400 });
  }

  // `githubId` is an INT4 column, so a larger id can't belong to any user (and would make Prisma throw).
  const id = Number(githubId);
  const user =
    id <= INT4_MAX
      ? await prisma.user.findUnique({ where: { githubId: id }, select: { id: true, banned: true } })
      : null;

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
