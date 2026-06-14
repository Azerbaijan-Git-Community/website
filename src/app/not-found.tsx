import { Metadata } from "next";
import Link from "next/link";
import { PiArrowLeftBold, PiHouseBold } from "react-icons/pi";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 pt-26 pb-24">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-gradient font-outfit text-[clamp(5rem,18vw,11rem)] leading-none font-bold">404</h1>

        {/* Git-flavored error line */}
        <div className="mx-auto mt-2 mb-8 max-w-md overflow-hidden rounded-lg border border-line bg-[rgba(13,17,23,0.6)] text-left">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-2">
            <span className="size-2.5 rounded-full bg-[#ff5f56]" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="size-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-lo">
            <span className="text-lime">$</span> git checkout <span className="text-blue">page</span>
            {"\n"}
            <span className="text-icon-pink">fatal:</span> pathspec did not match any
            {"\n"}
            file(s) known to this community.
          </pre>
        </div>

        <h2 className="mb-3 font-outfit text-2xl font-bold text-hi sm:text-3xl">This page doesn&apos;t exist</h2>
        <p className="mx-auto mb-8 max-w-md text-lo">
          The page you&apos;re looking for may have been moved, deleted, or never existed. Let&apos;s get you back on
          track.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-blue to-purple px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90 sm:w-auto"
          >
            <PiHouseBold className="size-4" />
            Back to home
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-6 text-sm font-semibold text-hi transition-all hover:-translate-y-0.5 hover:border-lo hover:bg-overlay sm:w-auto"
          >
            <PiArrowLeftBold className="size-4" />
            View leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
