"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { PiArrowRightBold, PiCheckBold } from "react-icons/pi";
import { syncMyStats } from "@/app/welcome/actions";
import { OmicronLogo } from "@/components/omicron-logo";
import type { BoardRank, UserRanks } from "@/data/leaderboard/get";
import { sizedGithubAvatar } from "@/lib/utils.client";
import { ContinueToLeaderboard, PRIMARY_BUTTON, useGoToLeaderboard } from "./continue-to-leaderboard";

type Step = { name: "syncing" } | { name: "ranks"; ranks: UserRanks } | { name: "omicron" } | { name: "error" };

/** Keeps the fetching state on screen long enough to read, even when the sync is instant. */
const MIN_SYNC_MS = 1200;

const EASE = [0.22, 1, 0.36, 1] as const;

const GHOST_BUTTON =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-md px-4 font-outfit text-sm font-semibold text-lo transition-colors hover:bg-overlay hover:text-hi focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

const PERIODS = [
  { key: "weekly", label: "This week" },
  { key: "monthly", label: "This month" },
  { key: "allTime", label: "All time" },
] as const;

function Heading({ children }: { children: ReactNode }) {
  return <h1 className="font-outfit text-2xl font-bold text-hi">{children}</h1>;
}

function Syncing({ image }: { image: string | null }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-6 size-20">
        <div aria-hidden className="absolute inset-0 animate-spin rounded-full border-2 border-line border-t-blue" />
        {image ? (
          <Image
            src={sizedGithubAvatar(image, 112)}
            alt=""
            width={64}
            height={64}
            unoptimized
            loading="eager"
            className="absolute inset-2 rounded-full"
          />
        ) : (
          <div className="absolute inset-2 animate-pulse rounded-full bg-surface" />
        )}
      </div>
      <Heading>Fetching your contributions</Heading>
      <output className="mt-2 block text-sm text-lo">Only takes a moment.</output>
    </div>
  );
}

function RankTile({ label, rank }: { label: string; rank: BoardRank }) {
  return (
    <div className="rounded-lg border border-line bg-[rgba(13,17,23,0.5)] px-3 py-4 text-center">
      <div className="text-xs tracking-wider text-lo uppercase">{label}</div>
      <div
        className={`mt-2 font-outfit text-4xl leading-none font-extrabold ${rank.rank ? "text-hi" : "text-dim"}`}
        aria-label={rank.rank ? `Rank ${rank.rank}` : "Not ranked"}
      >
        {rank.rank ? `#${rank.rank}` : "–"}
      </div>
      <div className="mt-2 font-mono text-xs text-lo">
        <span className={rank.commits ? "text-lime" : undefined}>{rank.commits.toLocaleString()}</span>{" "}
        {rank.commits === 1 ? "commit" : "commits"}
      </div>
    </div>
  );
}

function Ranks({ ranks, onContinue }: { ranks: UserRanks; onContinue: () => void }) {
  const ranked = PERIODS.some(({ key }) => ranks[key].rank !== null);
  return (
    <div className="text-center">
      <Heading>{ranked ? "You're on the leaderboard" : "Not on the leaderboard yet"}</Heading>
      <p className="mt-2 text-sm text-lo">
        {ranked
          ? "Here's where you stand among Azerbaijan's contributors."
          : "Only the top 50 make it. Push to public repos and you'll climb with every hourly sync."}
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {PERIODS.map(({ key, label }) => (
          <RankTile key={key} label={label} rank={ranks[key]} />
        ))}
      </div>
      <button type="button" onClick={onContinue} className={`${PRIMARY_BUTTON} mt-8 w-full`}>
        Continue
        <PiArrowRightBold className="size-4" />
      </button>
    </div>
  );
}

function OmicronTile({ connected }: { connected: boolean }) {
  return (
    <div className="relative mb-5 flex size-12 items-center justify-center rounded-xl border border-line bg-surface">
      <OmicronLogo />
      {connected && (
        <span className="absolute -right-1.5 -bottom-1.5 flex size-5 items-center justify-center rounded-full bg-green text-black ring-2 ring-canvas">
          <PiCheckBold className="size-3" />
        </span>
      )}
    </div>
  );
}

function OmicronConnected({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <OmicronTile connected />
      <Heading>Omicron is connected</Heading>
      <p className="mt-2 text-sm text-lo">
        Posts from <span className="font-medium text-hi">@{username}</span> appear on the community blog.
      </p>
      <div className="mt-8 flex w-full flex-col gap-2">
        <Link href="/account/blog" className={GHOST_BUTTON}>
          Manage your posts
        </Link>
        <ContinueToLeaderboard>
          Go to leaderboard
          <PiArrowRightBold className="size-4" />
        </ContinueToLeaderboard>
      </div>
    </div>
  );
}

function Omicron({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <OmicronTile connected={false} />
      <Heading>Publish your posts here</Heading>
      <p className="mt-2 text-sm text-lo">
        Connect your Omicron account and your public posts appear on the community blog.
      </p>
      <div className="mt-8 flex w-full flex-col gap-2">
        {/* oxlint-disable-next-line next/no-html-link-for-pages -- this route redirects off-site, so it must never be prefetched */}
        <a href="/api/omicron/connect?from=welcome" className={PRIMARY_BUTTON}>
          Connect Omicron
        </a>
        <button type="button" onClick={onSkip} className={GHOST_BUTTON}>
          Set up later
        </button>
      </div>
    </div>
  );
}

// `image` comes from the server so the avatar paints at once, from the same URL the navbar already loaded
export function WelcomeFlow({ image = null }: { image?: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "syncing" });
  const [omicronUsername, setOmicronUsername] = useState<string | null>(null);
  const goToLeaderboard = useGoToLeaderboard();
  useEffect(() => {
    let ignore = false;
    async function sync() {
      const [result] = await Promise.all([
        syncMyStats().catch(() => null),
        new Promise((r) => setTimeout(r, MIN_SYNC_MS)),
      ]);
      if (ignore) return;
      const data = result?.ok ? result.data : null;
      if (data && !data.signedIn) return router.replace("/");
      if (data) setOmicronUsername(data.omicronUsername);
      setStep(data?.ranks ? { name: "ranks", ranks: data.ranks } : { name: "error" });
    }
    void sync();
    return () => {
      ignore = true;
    };
  }, [router]);

  const next = () => setStep({ name: "omicron" });

  return (
    <MotionConfig reducedMotion="user">
      <section aria-live="polite" className="glass w-full max-w-md rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            {step.name === "syncing" && <Syncing image={image} />}
            {step.name === "ranks" && <Ranks ranks={step.ranks} onContinue={next} />}
            {step.name === "omicron" &&
              (omicronUsername ? (
                <OmicronConnected username={omicronUsername} />
              ) : (
                <Omicron onSkip={goToLeaderboard} />
              ))}
            {step.name === "error" && (
              <div className="text-center">
                <Heading>Something went wrong on our side</Heading>
                <p className="mt-2 text-sm text-lo">
                  We couldn&apos;t fetch your contributions. You&apos;ll appear on the leaderboard after the next hourly
                  sync.
                </p>
                <button type="button" onClick={next} className={`${PRIMARY_BUTTON} mt-8 w-full`}>
                  Continue
                  <PiArrowRightBold className="size-4" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </MotionConfig>
  );
}
