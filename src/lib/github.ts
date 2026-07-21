import "server-only";
import { serverEnv } from "@/lib/env.server";

// Thin wrapper over the GitHub REST + GraphQL APIs. Every sync goes through here so the
// token, headers, and error handling are defined once.

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

/**
 * `api.github.com/repos/org/blog/contents/posts -> 403` — the path already identifies which
 * post or project failed, so it carries the context a prose message would have repeated.
 * Reddened for the dev terminal only; escape codes are noise in production log aggregators.
 */
function requestFailed(url: string, status: number): Error {
  const { host, pathname } = new URL(url);
  const message = `${host}${pathname} -> ${status}`;
  return new Error(process.env.NODE_ENV === "production" ? message : `\x1b[31m${message}\x1b[0m`);
}

async function ghGet(url: string, accept?: string): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders(accept ? { Accept: accept } : undefined) });
  if (!res.ok) throw requestFailed(url, res.status);
  return res;
}

/** GET a path under api.github.com (e.g. `/repos/org/repo/contents/posts`) as JSON. */
export async function ghJson<T>(path: string): Promise<T> {
  const res = await ghGet(`${GITHUB_API}${path}`, "application/vnd.github+json");
  return res.json() as Promise<T>;
}

/** GET an absolute URL (raw.githubusercontent.com, a contents `download_url`, …) as text. */
export async function ghText(url: string): Promise<string> {
  const res = await ghGet(url);
  return res.text();
}

/**
 * POST a GraphQL query. A 200 is returned as the raw envelope rather than throwing, because
 * partial failures (some aliases resolved, others errored) are normal for the batched queries
 * and callers need to inspect `errors` to decide what to retry.
 *
 * Transport failures are different and do throw: a 401/403/5xx carries `{ message }` with
 * neither `data` nor `errors`, which every caller would read as "all aliases failed, nothing
 * to retry" — turning an expired token or a rate limit into a silent no-op that still reports
 * a successful sync.
 */
export async function ghGraphQL<T>(query: string): Promise<{ data?: T; errors?: unknown[] }> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw requestFailed(GITHUB_GRAPHQL, res.status);
  return res.json();
}
