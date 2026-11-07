import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { clientEnv } from "@/lib/env.client";
import { serverEnv } from "@/lib/env.server";

// Thin wrapper over the Omicron instance's API. Omicron's contract package isn't published,
// so the fields this site reads are restated here, and a response without them fails loudly.

const TIMEOUT_MS = 10_000;
const SIGNATURE_WINDOW_S = 5 * 60;

export const OMICRON_OAUTH_COOKIE = "omicron_oauth";
export const OMICRON_SCOPES = "read:accounts webhooks:posts";
export const omicronCallbackUrl = () => new URL("/api/omicron/callback", clientEnv.NEXT_PUBLIC_BASE_URL).toString();
export const omicronWebhookUrl = () => new URL("/api/webhooks/omicron", clientEnv.NEXT_PUBLIC_BASE_URL).toString();

const OmicronPostSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  slug: z.string().nullable(),
  contentHtml: z.string(),
  remote: z.boolean(),
  aiAssisted: z.boolean(),
  status: z.string(),
  summary: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  author: z.object({ username: z.string() }),
  tags: z.array(z.object({ name: z.string() })),
});
export type OmicronPost = z.infer<typeof OmicronPostSchema>;

export const OmicronEventSchema = z.object({
  event: z.enum(["post.created", "post.updated", "post.deleted", "connection.revoked"]),
  postId: z.string().nullable(),
  username: z.string(),
});

/** A failed Omicron request. Nothing is inferred from it: only a 404 means something is gone. */
export class OmicronRequestError extends Error {
  readonly status: number;

  constructor(path: string, status: number) {
    super(`Omicron ${path} -> ${status}`);
    this.name = "OmicronRequestError";
    this.status = status;
  }
}

async function request(origin: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(new URL(path, origin), { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
}

async function json<S extends z.ZodType>(schema: S, path: string, res: Response): Promise<z.infer<S>> {
  if (!res.ok) throw new OmicronRequestError(path, res.status);
  return schema.parse(await res.json());
}

export function omicronAuthorizeUrl(state: string, codeChallenge: string): string {
  const url = new URL("/oauth/authorize", serverEnv.OMICRON_ORIGIN);
  url.search = new URLSearchParams({
    client_id: serverEnv.OMICRON_CLIENT_ID,
    redirect_uri: omicronCallbackUrl(),
    response_type: "code",
    scope: OMICRON_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

export async function exchangeOmicronCode(code: string, codeVerifier: string): Promise<string> {
  const path = "/oauth/token";
  const res = await request(serverEnv.OMICRON_ORIGIN, path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: serverEnv.OMICRON_CLIENT_ID,
      client_secret: serverEnv.OMICRON_CLIENT_SECRET,
      redirect_uri: omicronCallbackUrl(),
      code,
      code_verifier: codeVerifier,
    }),
  });
  return (await json(z.object({ access_token: z.string() }), path, res)).access_token;
}

export async function fetchOmicronUsername(accessToken: string): Promise<string> {
  const path = "/api/v1/accounts/verify_credentials";
  const res = await request(serverEnv.OMICRON_ORIGIN, path, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return (await json(z.object({ username: z.string() }), path, res)).username;
}

export async function createOmicronSubscription(accessToken: string) {
  const path = "/api/webhook-subscriptions";
  const res = await request(serverEnv.OMICRON_ORIGIN, path, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: omicronWebhookUrl() }),
  });
  return json(z.object({ id: z.string(), secret: z.string() }), path, res);
}

/** The post as an anonymous reader sees it, or null when it's gone or no longer public. */
export async function fetchOmicronPost(origin: string, id: string): Promise<OmicronPost | null> {
  const path = `/api/posts/${encodeURIComponent(id)}`;
  const res = await request(origin, path);
  if (res.status === 404) return null;
  return (await json(z.object({ post: OmicronPostSchema }), path, res)).post;
}

const OmicronPostPageSchema = z.object({ items: z.array(OmicronPostSchema), nextCursor: z.string().nullable() });

/** One page of an author's public posts, or null when the account no longer exists. */
export async function fetchOmicronAuthorPosts(origin: string, username: string, cursor: string | null) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const path = `/api/users/${encodeURIComponent(username)}/posts${query}`;
  const res = await request(origin, path);
  if (res.status === 404) return null;
  return json(OmicronPostPageSchema, path, res);
}

/** Checks `X-Omicron-Signature: t=<unix seconds>,v1=<hex>`, an HMAC-SHA256 of `<t>.<raw body>`. */
export function isValidOmicronSignature(secret: string, header: string | null, body: string, now = Date.now()) {
  const match = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(header ?? "");
  if (!match) return false;
  const [, timestamp, signature] = match;
  if (Math.abs(now / 1000 - Number(timestamp)) > SIGNATURE_WINDOW_S) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
