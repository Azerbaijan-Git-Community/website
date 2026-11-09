import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clientEnv } from "@/lib/env.client";
import { serverEnv } from "@/lib/env.server";
import {
  createOmicronSubscription,
  exchangeOmicronCode,
  fetchOmicronUsername,
  OMICRON_OAUTH_COOKIE,
} from "@/lib/omicron";
import { prisma } from "@/lib/prisma";
import { reconcileAccount } from "@/lib/sync/sync-omicron";

function done(error?: "denied" | "expired" | "taken" | "banned" | "failed", fromWelcome = false) {
  const url = new URL("/account/blog", clientEnv.NEXT_PUBLIC_BASE_URL);
  if (error) url.searchParams.set("error", error);
  if (fromWelcome) url.searchParams.set("from", "welcome");
  const res = NextResponse.redirect(url);
  res.cookies.set(OMICRON_OAUTH_COOKIE, "", { path: "/api/omicron", maxAge: 0 });
  return res;
}

function sameText(a: string, b: string) {
  const [left, right] = [Buffer.from(a), Buffer.from(b)];
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.redirect(new URL("/blog", clientEnv.NEXT_PUBLIC_BASE_URL));

  const { searchParams } = req.nextUrl;
  const [expectedState, verifier, cameFrom] = (req.cookies.get(OMICRON_OAUTH_COOKIE)?.value ?? "").split(".");
  const fromWelcome = cameFrom === "welcome";
  const finish = (error?: Parameters<typeof done>[0]) => done(error, fromWelcome);
  const state = searchParams.get("state");
  if (!expectedState || !verifier || !state || !sameText(state, expectedState)) return finish("expired");

  const code = searchParams.get("code");
  if (!code) return finish("denied");

  const userId = session.user.id;
  const origin = serverEnv.OMICRON_ORIGIN;
  try {
    const accessToken = await exchangeOmicronCode(code, verifier);
    const username = await fetchOmicronUsername(accessToken);

    const [linked, existing, user] = await Promise.all([
      prisma.omicronConnection.findUnique({ where: { origin_username: { origin, username } } }),
      prisma.omicronConnection.findUnique({ where: { userId } }),
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { blogBanned: true } }),
    ]);
    if (linked && linked.userId !== userId) return finish("taken");
    if (user.blogBanned && existing?.username !== username) return finish("banned");

    // The tokens end here: the subscription outlives them, and public reads don't need them.
    const subscription = await createOmicronSubscription(accessToken);
    const fields = { origin, username, subscriptionId: subscription.id, webhookSecret: subscription.secret };
    const connection = await prisma.omicronConnection.upsert({
      where: { userId },
      create: { userId, ...fields },
      update: fields,
    });

    // The daily reconcile picks this up if it fails, so the member still gets connected.
    await reconcileAccount(connection).catch((error: unknown) => {
      console.warn(`[omicron] first import failed for ${username}:`, error);
    });
    return finish();
  } catch (error) {
    console.warn("[omicron] connecting failed:", error);
    return finish("failed");
  }
}
