import { makeSignature } from "better-auth/crypto";
import { auth } from "@/lib/auth";

/** Create a real DB session for `userId` and return request headers carrying its signed session cookie. */
export async function sessionHeadersFor(userId: string): Promise<Headers> {
  const ctx = await auth.$context;
  const session = await ctx.internalAdapter.createSession(userId);
  const signed = `${session.token}.${await makeSignature(session.token, ctx.secret)}`;
  return new Headers({ cookie: `${ctx.authCookies.sessionToken.name}=${encodeURIComponent(signed)}` });
}
