"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { MemberBlogPost } from "@/data/blog/manage";
import { ResponseSchema } from "@/lib/utils";
import { formatDate } from "@/lib/utils.client";

const BUTTON =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-surface px-4 font-outfit text-xs font-semibold text-hi transition-[background-color,border-color,opacity] hover:border-lo hover:bg-overlay focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  posts: MemberBlogPost[];
  reviewed: boolean;
  canDisconnect: boolean;
  omicronUrl: string;
};

function postState(post: MemberBlogPost) {
  if (post.removedByAdminAt) return "An admin removed this post";
  if (post.sourceMissingAt) return "No longer public on Omicron";
  return null;
}

export function BlogPostsManager({ posts, reviewed, canDisconnect, omicronUrl }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [ticked, setTicked] = useState(() => new Set(posts.flatMap((post) => (postState(post) ? [] : [post.id]))));

  async function send(url: string, init: RequestInit) {
    setBusy(true);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = ResponseSchema.parse(await res.json().catch(() => ({})));
      if (res.ok) {
        toast.success(data.message ?? "Saved.");
        router.refresh();
      } else {
        toast.error(data.error ?? `Request failed (${res.status})`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Network error");
    }
    setBusy(false);
  }

  const setVisible = (id: string, visible: boolean) =>
    send(`/api/account/blog/posts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ visible }) });

  const toggleTicked = (id: string) =>
    setTicked((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <>
      {!reviewed && (
        <p className="mb-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-lo">
          Nothing is on the blog yet. Untick anything you'd rather keep off it, then confirm.
        </p>
      )}

      {posts.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <p className="font-outfit text-lg text-lo">No posts yet.</p>
          <a href={omicronUrl} className="text-sm text-blue transition-colors hover:text-lime">
            Write your first one on Omicron
          </a>
        </div>
      ) : (
        <ul className="glass overflow-hidden rounded-xl">
          {posts.map((post) => {
            const locked = postState(post);
            const hidden = post.removedByAuthorAt !== null;
            return (
              <li
                key={post.id}
                className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 last:border-0"
              >
                {!reviewed && (
                  <input
                    type="checkbox"
                    aria-label={`Show "${post.title}" on the blog`}
                    checked={ticked.has(post.id)}
                    disabled={locked !== null}
                    onChange={() => toggleTicked(post.id)}
                    className="size-4 shrink-0 cursor-pointer accent-blue disabled:cursor-not-allowed"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-outfit font-semibold text-hi transition-colors hover:text-blue"
                  >
                    {post.title}
                  </a>
                  <p className="text-xs text-dim">
                    {formatDate(post.createdAt)}
                    {locked && ` · ${locked}`}
                  </p>
                </div>
                {reviewed && !locked && (
                  <button type="button" disabled={busy} onClick={() => setVisible(post.id, hidden)} className={BUTTON}>
                    {hidden ? "Show on blog" : "Hide from blog"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {reviewed ? (
          <span />
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              send("/api/account/blog/review", {
                method: "POST",
                body: JSON.stringify({ visibleIds: [...ticked] }),
              })
            }
            className={BUTTON}
          >
            Confirm and publish {ticked.size} of {posts.length}
          </button>
        )}

        {canDisconnect && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!confirmingDisconnect) return setConfirmingDisconnect(true);
              return send("/api/omicron/connection", { method: "DELETE" });
            }}
            onBlur={() => setConfirmingDisconnect(false)}
            className="cursor-pointer text-sm font-medium text-lo transition-colors hover:text-danger focus-visible:text-danger focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmingDisconnect ? "Click again: all your posts leave the blog" : "Disconnect Omicron"}
          </button>
        )}
      </div>
    </>
  );
}
