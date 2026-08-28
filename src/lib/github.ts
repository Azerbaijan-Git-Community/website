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

/** Build an error like `host/path -> 403 | body: … | retry-after: …s`; reddened outside production. */
async function requestFailed(url: string, res: Response): Promise<Error> {
  const { host, pathname } = new URL(url);
  const body = await res.text().catch(() => "");
  const parts = [
    `${host}${pathname} -> ${res.status}`,
    body && `body: ${body.slice(0, 500)}`,
    res.headers.get("retry-after") && `retry-after: ${res.headers.get("retry-after")}s`,
    res.headers.get("x-ratelimit-remaining") && `ratelimit-remaining: ${res.headers.get("x-ratelimit-remaining")}`,
    res.headers.get("x-ratelimit-reset") && `ratelimit-reset: ${res.headers.get("x-ratelimit-reset")}`,
  ].filter(Boolean);
  const message = parts.join(" | ");
  return new Error(process.env.NODE_ENV === "production" ? message : `\x1b[31m${message}\x1b[0m`);
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
