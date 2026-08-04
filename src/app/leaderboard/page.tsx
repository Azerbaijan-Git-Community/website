import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { PiArrowsClockwise } from "react-icons/pi";
import { PodiumClient } from "@/components/leaderboard/podium-client";
import { SyncCountdown } from "@/components/leaderboard/sync-countdown";
import { TableClient } from "@/components/leaderboard/table-client";
import { getLastSyncTime, getPodiumData, getTableData } from "@/data/leaderboard/get";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Track top GitHub contributors from Azerbaijan. Rankings by commits, pull requests, and repositories — updated weekly and monthly.",
  keywords: [
    "Azerbaijan GitHub leaderboard",
    "top GitHub contributors Azerbaijan",
    "Azerbaijan developer rankings",
    "GitHub contributions Azerbaijan",
    "open source leaderboard Azerbaijan",
    "Azerbaijan programmer stats",
  ],
};

export default async function LeaderboardPage() {
  "use cache";
  cacheLife("max");
  cacheTag("leaderboard");

  const [tableData, podiumData, lastSync] = await Promise.all([getTableData(), getPodiumData(), getLastSyncTime()]);

  return (
    <div className="min-h-svh pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            Community Rankings
          </span>
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Monthly <span className="text-gradient">Leaderboard</span>
          </h1>
          <h2 className="mx-auto mb-6 max-w-2xl text-xl text-lo">
            Top 50 contributors pushing Azerbaijan&apos;s open-source future forward.
          </h2>
        </div>

        <div className="mb-16">
          <PodiumClient allData={podiumData} />
        </div>

        {lastSync && (
          <div className="mb-5 flex justify-center">
            <div className="flex items-center gap-1.5 text-sm text-dim">
              <Suspense
                fallback={
                  <>
                    <PiArrowsClockwise size={14} />
                    <span>Next sync in 00:00</span>
                  </>
                }
              >
                <SyncCountdown lastSync={lastSync} />
              </Suspense>
            </div>
          </div>
        )}

        <TableClient allData={tableData} />
      </div>
    </div>
  );
}
