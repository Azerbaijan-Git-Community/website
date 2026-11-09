import type { Metadata } from "next";
import { Suspense } from "react";
import { PiArrowRightBold } from "react-icons/pi";
import { AccountBlogContent, AccountBlogSkeleton } from "@/components/account/account-blog-content";
import { ContinueToLeaderboard } from "@/components/welcome/continue-to-leaderboard";

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

/** Omicron sends members who connected from the welcome flow here; this leads them on to its end. */
async function WelcomeNextStep({ searchParams }: { searchParams: PageProps<"/account/blog">["searchParams"] }) {
  const { from } = await searchParams;
  if (from !== "welcome") return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-3">
      <p className="text-sm text-lo">Choose which posts appear on the blog, then head to the leaderboard.</p>
      <ContinueToLeaderboard size="sm">
        Continue
        <PiArrowRightBold className="size-4" />
      </ContinueToLeaderboard>
    </div>
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
        <Suspense fallback={null}>
          <WelcomeNextStep searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<AccountBlogSkeleton />}>
          <AccountBlogContent />
        </Suspense>
      </div>
    </div>
  );
}
