import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BlogPostsManager } from "@/components/account/blog-posts-manager";
import { OmicronLogo } from "@/components/omicron-logo";
import { getMemberBlog } from "@/data/blog/manage";
import { auth } from "@/lib/auth";

async function getSignedInMemberBlog() {
  "use cache: private";
  // Never stored on the server: this lets the browser reuse it, so coming back to the page is instant.
  cacheLife({ stale: 60 });

  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ? getMemberBlog(session.user.id) : null;
}

export function AccountBlogSkeleton() {
  return (
    <div aria-hidden="true" data-testid="account-blog-skeleton">
      <div className="mb-8 h-6 w-full max-w-xl animate-pulse rounded-md bg-surface" />
      <div className="glass overflow-hidden rounded-xl">
        {["first", "second", "third"].map((row) => (
          <div key={row} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
            <div className="flex-1">
              <div className="mb-2 h-5 w-2/3 animate-pulse rounded-md bg-surface" />
              <div className="h-3 w-24 animate-pulse rounded-md bg-surface" />
            </div>
            <div className="h-9 w-28 animate-pulse rounded-md bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}

export async function AccountBlogContent() {
  const blog = await getSignedInMemberBlog();
  if (!blog) redirect("/blog");

  const { connection, blogBanned, blogBanReason, posts } = blog;

  return (
    <>
      <p className="mb-8 text-lo">
        {connection
          ? `Posts from @${connection.username} on Omicron. New posts appear on the blog automatically; hide any you don't want here.`
          : "Connect your Omicron account and your posts will appear on the community blog. You choose which ones stay."}
      </p>

      {blogBanned && (
        <output className="mb-6 block rounded-lg border border-line bg-surface px-4 py-3 text-sm text-lo">
          An admin banned you from the blog, so your posts aren't shown.
          {blogBanReason ? ` Reason: ${blogBanReason}` : ""}
        </output>
      )}

      {connection?.subscriptionId ? (
        <BlogPostsManager
          posts={posts}
          reviewed={connection.reviewedAt !== null}
          canDisconnect={!blogBanned}
          omicronUrl={new URL(`/@${connection.username}`, connection.origin).toString()}
        />
      ) : (
        <div className="glass flex flex-col items-center gap-4 rounded-xl p-10 text-center">
          <p className="font-outfit text-lg text-lo">
            {connection ? "This connection was ended on Omicron." : "No Omicron account connected yet."}
          </p>
          {/* oxlint-disable-next-line next/no-html-link-for-pages -- this route redirects off-site */}
          <a
            href="/api/omicron/connect"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 font-outfit text-sm font-semibold text-hi transition-[background-color,border-color] hover:border-lo hover:bg-overlay focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
          >
            <OmicronLogo />
            Connect Omicron
          </a>
        </div>
      )}
    </>
  );
}
