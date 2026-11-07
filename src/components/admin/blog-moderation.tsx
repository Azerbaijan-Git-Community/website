"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ModerationPost } from "@/data/blog/manage";
import { ResponseSchema } from "@/lib/utils";
import { formatDate } from "@/lib/utils.client";

const BUTTON =
  "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-surface px-3 font-outfit text-xs font-semibold text-hi transition-[background-color,border-color,color,opacity] hover:border-lo hover:bg-overlay focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";
const DANGER_BUTTON = `${BUTTON} hover:text-danger`;

export function BlogModeration({ posts }: { posts: ModerationPost[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmingBan, setConfirmingBan] = useState<string | null>(null);

  async function send(url: string, body: object) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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

  const moderatePost = (id: string, removed: boolean) =>
    send(`/api/admin/blog/posts/${encodeURIComponent(id)}`, { removed });
  const moderateUser = (id: string, action: "blog-ban" | "blog-unban" | "ban" | "unban") =>
    send(`/api/admin/blog/users/${encodeURIComponent(id)}`, { action, reason: reason || undefined });

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-line bg-[rgba(13,17,23,0.6)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="font-mono text-xs font-semibold tracking-wider text-lo uppercase">Blog moderation</h2>
        <label className="flex items-center gap-2 text-xs text-lo">
          Ban reason
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Optional"
            className="rounded-md border border-line bg-canvas px-2 py-1 font-mono text-xs text-hi outline-none focus:border-blue"
          />
        </label>
      </div>

      {posts.length === 0 ? (
        <p className="px-5 py-8 text-center font-outfit text-lo">No blog posts yet.</p>
      ) : (
        <ul>
          {posts.map((post) => {
            const { author } = post;
            const isAdmin = author.role === "admin";
            const removed = post.removedByAdminAt !== null;
            return (
              <li key={post.id} className="border-b border-line px-5 py-4 last:border-0">
                <div className="mb-3 min-w-0">
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-outfit text-sm font-semibold text-hi transition-colors hover:text-blue"
                  >
                    {post.title}
                  </a>
                  <p className="font-mono text-xs text-dim">
                    @{author.githubUsername} · {formatDate(post.createdAt)}
                    {removed && " · removed by admin"}
                    {post.removedByAuthorAt && " · hidden by author"}
                    {author.blogBanned && " · blog banned"}
                    {author.banned && " · banned"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => moderatePost(post.id, !removed)}
                    className={DANGER_BUTTON}
                  >
                    {removed ? "Restore post" : "Remove post"}
                  </button>
                  {!isAdmin && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => moderateUser(author.id, author.blogBanned ? "blog-unban" : "blog-ban")}
                        className={DANGER_BUTTON}
                      >
                        {author.blogBanned ? "Allow on blog" : "Ban from blog"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (author.banned) return moderateUser(author.id, "unban");
                          if (confirmingBan !== post.id) return setConfirmingBan(post.id);
                          setConfirmingBan(null);
                          return moderateUser(author.id, "ban");
                        }}
                        onBlur={() => setConfirmingBan(null)}
                        className={DANGER_BUTTON}
                      >
                        {author.banned ? "Unban user" : confirmingBan === post.id ? "Click again to ban" : "Ban user"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
