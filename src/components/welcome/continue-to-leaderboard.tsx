"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SCROLL_TO_ME_KEY } from "@/components/leaderboard/scroll-to-me";

const PRIMARY_BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-green font-outfit text-sm font-semibold text-black transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-lime hover:shadow-[0_0_15px_rgba(46,160,67,0.4)] focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

export const PRIMARY_BUTTON = `${PRIMARY_BASE} h-11 px-6`;
const PRIMARY_BUTTON_SMALL = `${PRIMARY_BASE} h-9 px-4`;

/** Ends the welcome flow: the leaderboard then scrolls to the new member's row. */
export function useGoToLeaderboard() {
  const router = useRouter();
  return () => {
    try {
      sessionStorage.setItem(SCROLL_TO_ME_KEY, "1");
    } catch {
      // Storage can be blocked; the leaderboard still highlights the member, it just won't scroll there.
    }
    router.push("/leaderboard");
  };
}

export function ContinueToLeaderboard({ size = "md", children }: { size?: "sm" | "md"; children: ReactNode }) {
  const goToLeaderboard = useGoToLeaderboard();
  return (
    <button type="button" onClick={goToLeaderboard} className={size === "sm" ? PRIMARY_BUTTON_SMALL : PRIMARY_BUTTON}>
      {children}
    </button>
  );
}
