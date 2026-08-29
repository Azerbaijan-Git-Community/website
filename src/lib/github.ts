import "server-only";
import { serverEnv } from "@/lib/env.server";

// Thin wrapper over the GitHub REST + GraphQL APIs: token, headers, and errors in one place.

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = `${GITHUB_API}/graphql`;

/** An entry from the REST contents API (`/repos/{owner}/{repo}/contents/{path}`). */
export type GhContentEntry = {
  name: string;
  sha: string;
  type: "dir" | "file";
  download_url: string;
};

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${serverEnv.GH_STATS_TOKEN}`, ...extra };
}

/** A failed GitHub request, carrying the parsed `retry-after` so callers can wait out a rate limit. */
export class GithubRequestError extends Error {
  readonly status: number;
  /** `retry-after` in ms, or `null` if GitHub didn't send it. */
  readonly retryAfterMs: number | null;
  /** True for a secondary-rate-limit 403/429 — the whole token is throttled, not just this query. */
  readonly secondaryRateLimit: boolean;

  constructor(message: string, opts: { status: number; retryAfterMs: number | null; secondaryRateLimit: boolean }) {
    super(message);
    this.name = "GithubRequestError";
    this.status = opts.status;
    this.retryAfterMs = opts.retryAfterMs;
    this.secondaryRateLimit = opts.secondaryRateLimit;
  }
}

/** Parse the `retry-after` header (delta seconds) into ms. GitHub sends seconds for rate limits. */
function parseRetryAfterMs(retryAfter: string | null): number | null {
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

/** Build an error like `host/path -> 403 | body: … | retry-after: …s`; reddened outside production. */
async function requestFailed(url: string, res: Response): Promise<GithubRequestError> {
  const { host, pathname } = new URL(url);
  const body = await res.text().catch(() => "");
  const retryAfter = res.headers.get("retry-after");
  const parts = [
    `${host}${pathname} -> ${res.status}`,
    body && `body: ${body.slice(0, 500)}`,
    retryAfter && `retry-after: ${retryAfter}s`,
    res.headers.get("x-ratelimit-remaining") && `ratelimit-remaining: ${res.headers.get("x-ratelimit-remaining")}`,
    res.headers.get("x-ratelimit-reset") && `ratelimit-reset: ${res.headers.get("x-ratelimit-reset")}`,
  ].filter(Boolean);
  const message = parts.join(" | ");

  // A 403/429 that names the limit in the body or ships a `retry-after` is a secondary rate limit.
  const secondaryRateLimit =
    (res.status === 403 || res.status === 429) && (/secondary rate limit/i.test(body) || retryAfter !== null);

  return new GithubRequestError(process.env.NODE_ENV === "production" ? message : `\x1b[31m${message}\x1b[0m`, {
    status: res.status,
    retryAfterMs: parseRetryAfterMs(retryAfter),
    secondaryRateLimit,
  });
}

async function ghGet(url: string, accept?: string): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders(accept ? { Accept: accept } : undefined) });
  if (!res.ok) throw await requestFailed(url, res);
  return res;
}

/** GET an api.github.com path (e.g. `/repos/org/repo/contents/posts`) as JSON. */
export async function ghJson<T>(path: string): Promise<T> {
  const res = await ghGet(`${GITHUB_API}${path}`, "application/vnd.github+json");
  return res.json();
}

/** GET an absolute URL as text. */
export async function ghText(url: string): Promise<string> {
  const res = await ghGet(url);
  return res.text();
}

/** GET a file's content by its immutable blob SHA — content-addressed, never CDN-stale. */
export async function ghBlobText(owner: string, repo: string, sha: string): Promise<string> {
  const res = await ghGet(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs/${sha}`, "application/vnd.github.raw");
  return res.text();
}

/** GET a contents-path file as raw text via api.github.com — fresh (private-cached), unlike the raw CDN. */
export async function ghRawContent(path: string): Promise<string> {
  const res = await ghGet(`${GITHUB_API}${path}`, "application/vnd.github.raw");
  return res.text();
}

/**
 * POST a GraphQL query, returning a 200 envelope unthrown so callers can inspect per-alias
 * `errors` (normal for batched queries). Transport failures (401/403/5xx) still throw, so an
 * expired token or rate limit can't masquerade as "all aliases failed" and no-op silently.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
export async function ghGraphQL<T>(query: string): Promise<{ data?: T; errors?: unknown[] }> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw await requestFailed(GITHUB_GRAPHQL, res);
  return res.json();
}
