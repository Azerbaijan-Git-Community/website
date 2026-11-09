import { createHash, randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clientEnv } from "@/lib/env.client";
import { OMICRON_OAUTH_COOKIE, omicronAuthorizeUrl } from "@/lib/omicron";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.redirect(new URL("/blog", clientEnv.NEXT_PUBLIC_BASE_URL));

  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  // Remembered so the callback can send a new member back into the welcome flow's last step
  const fromWelcome = req.nextUrl.searchParams.get("from") === "welcome";
  const res = NextResponse.redirect(omicronAuthorizeUrl(state, challenge));
  res.cookies.set(OMICRON_OAUTH_COOKIE, [state, verifier, ...(fromWelcome ? ["welcome"] : [])].join("."), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/omicron",
    maxAge: 10 * 60,
  });
  return res;
}
