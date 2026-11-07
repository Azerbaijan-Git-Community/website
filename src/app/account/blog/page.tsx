import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountBlogContent, AccountBlogSkeleton } from "@/components/account/account-blog-content";

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

async function ConnectError({ searchParams }: { searchParams: PageProps<"/account/blog">["searchParams"] }) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  if (!message) return null;

  return (
    <p role="alert" className="mb-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

// Nothing here waits for data, so this shell can be prefetched and shows at once; the posts stream into it.
export default function AccountBlogPage({ searchParams }: PageProps<"/account/blog">) {
  return (
    <div className="min-h-svh pt-32 pb-24">
      <div className="mx-auto max-w-200 px-8">
        <h1 className="mb-2 font-outfit text-[clamp(2rem,4vw,3rem)] leading-tight font-bold text-hi">My blog posts</h1>
        <Suspense fallback={null}>
          <ConnectError searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<AccountBlogSkeleton />}>
          <AccountBlogContent />
        </Suspense>
      </div>
    </div>
  );
}
