import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { disconnectOmicron } from "@/lib/sync/sync-omicron";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await prisma.omicronConnection.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return NextResponse.json({ connected: connection !== null });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { blogBanned: true } });
  if (user?.blogBanned) {
    return NextResponse.json({ error: "You can't disconnect while banned from the blog." }, { status: 403 });
  }

  await disconnectOmicron(session.user.id);
  return NextResponse.json({ message: "Disconnected. Your posts have left this site." });
}
