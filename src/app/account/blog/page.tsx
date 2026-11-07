import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PiLinkBold } from "react-icons/pi";
import { BlogPostsManager } from "@/components/account/blog-posts-manager";
import { getMemberBlog } from "@/data/blog/manage";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My blog posts",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  denied: "Omicron didn't connect because the request wasn't approved.",
  expired: "That connection attempt expired. Please try again.",
  taken: "That Omicron account is already connected to another member.",
  banned: "You can't connect a different account while banned from the blog.",
  failed: "Something went wrong while connecting to Omicron. Please try again.",
};

export default async function AccountBlogPage({ searchParams }: PageProps<"/account/blog">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/blog");

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;
  const { connection, blogBanned, blogBanReason, posts } = await getMemberBlog(session.user.id);

  return (
    <div className="min-h-svh pt-32 pb-24">
      <div className="mx-auto max-w-200 px-8">
        <header className="mb-8">
          <h1 className="mb-2 font-outfit text-[clamp(2rem,4vw,3rem)] leading-tight font-bold text-hi">
            My blog posts
          </h1>
          <p className="text-lo">
            {connection
              ? `Posts from @${connection.username} on Omicron. New posts appear on the blog automatically; hide any you don't want here.`
              : "Connect your Omicron account and your posts will appear on the community blog. You choose which ones stay."}
          </p>
        </header>

        {errorMessage && (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {errorMessage}
          </p>
        )}

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
              <PiLinkBold className="size-4" />
              Connect Omicron
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
