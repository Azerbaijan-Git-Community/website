import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PiGithubLogoBold, PiHouseBold } from "react-icons/pi";

export const metadata: Metadata = {
  title: "Authentication error",
  robots: { index: false, follow: false },
};

type ErrorCopy = {
  reason: string;
  title: string;
  description: string;
};

const ERROR_COPY: Record<string, ErrorCopy> = {
  access_denied: {
    reason: "authorization was declined",
    title: "Sign-in was cancelled",
    description: "You dismissed the GitHub authorization prompt. Give it another push whenever you're ready.",
  },
  unable_to_create_user: {
    reason: "could not create your account",
    title: "We couldn't set up your account",
    description: "Something went wrong while creating your profile. Please try signing in again in a moment.",
  },
  account_not_linked: {
    reason: "email already linked to another account",
    title: "This account isn't linked",
    description:
      "This GitHub email is already tied to a different sign-in method. Use the original method, then link GitHub from your settings.",
  },
  state_mismatch: {
    reason: "session state did not match",
    title: "Your sign-in session expired",
    description: "The sign-in link went stale or was opened in a different browser. Start a fresh sign-in to continue.",
  },
  invalid_state: {
    reason: "session state was invalid",
    title: "Your sign-in session expired",
    description: "The sign-in link went stale or was opened in a different browser. Start a fresh sign-in to continue.",
  },
  please_restart_the_process: {
    reason: "the flow needs to restart",
    title: "Let's restart your sign-in",
    description: "The authentication flow was interrupted. Head back and start the sign-in process again.",
  },
};

const DEFAULT_COPY: ErrorCopy = {
  reason: "merge conflict during authentication",
  title: "Something went wrong signing you in",
  description:
    "Something went wrong on our side while signing you in. Please try again, and reach out if it keeps happening.",
};

function normalizeCode(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "UNKNOWN").toLowerCase();
}

async function AuthErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; error_description?: string | string[] }>;
}) {
  const params = await searchParams;
  const code = normalizeCode(params.error);
  const copy = ERROR_COPY[code] ?? DEFAULT_COPY;
  const rawDescription = Array.isArray(params.error_description)
    ? params.error_description[0]
    : params.error_description;

  return (
    <div className="w-full max-w-xl text-center">
      <h1 className="text-gradient font-outfit text-[clamp(4rem,15vw,9rem)] leading-none font-bold">401</h1>

      {/* Git-flavored error line */}
      <div className="mx-auto mt-2 mb-8 max-w-md overflow-hidden rounded-lg border border-line bg-[rgba(13,17,23,0.6)] text-left">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2">
          <span className="size-2.5 rounded-full bg-[#ff5f56]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-lo">
          <span className="text-lime">$</span> gh auth login
          {"\n"}
          <span className="text-icon-pink">! [rejected]</span> {copy.reason}
          {"\n"}
          error: failed to authenticate to <span className="text-blue">githubcommunity.az</span>
          {rawDescription ? (
            <>
              {"\n"}
              <span className="text-lo">hint:</span> {rawDescription}
            </>
          ) : null}
        </pre>
      </div>

      <h2 className="mb-3 font-outfit text-2xl font-bold text-hi sm:text-3xl">{copy.title}</h2>
      <p className="mx-auto mb-8 max-w-md text-lo">{copy.description}</p>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-blue to-purple px-6 text-sm font-semibold text-white transition-[transform,opacity] hover:-translate-y-0.5 hover:opacity-90 sm:w-auto"
        >
          <PiHouseBold className="size-4" />
          Back to home
        </Link>
        <a
          href="https://github.com/Azerbaijan-Git-Community/website/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-6 text-sm font-semibold text-hi transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-lo hover:bg-overlay sm:w-auto"
        >
          <PiGithubLogoBold className="size-4" />
          Open an Issue on GitHub
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; error_description?: string | string[] }>;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 pt-26 pb-24">
      <Suspense
        fallback={
          <div className="h-64 w-full max-w-xl animate-pulse rounded-lg border border-line bg-surface/40" aria-hidden />
        }
      >
        <AuthErrorContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
