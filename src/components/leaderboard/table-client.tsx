"use client";

import { AnimatePresence, motion } from "motion/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import useSWR, { preload } from "swr";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { type LeaderboardEntry, getLeaderboard, getMonthlyLeaderboard } from "@/data/leaderboard/get";

function getRankBadgeClass(rank: number): string {
  if (rank === 1)
    return "bg-linear-to-br from-[#FFD700] to-[#FFA500] text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.5)]";
  if (rank === 2)
    return "bg-linear-to-br from-[#C0C0C0] to-[#A8A8A8] text-black font-bold shadow-[0_0_15px_rgba(192,192,192,0.5)]";
  if (rank === 3)
    return "bg-linear-to-br from-[#CD7F32] to-[#B87333] text-black font-bold shadow-[0_0_15px_rgba(205,127,50,0.5)]";
  return "bg-surface text-lo border border-line";
}

function getRankIcon(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

function EmptyState() {
  return (
    <div className="glass flex min-h-110 items-center justify-center rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      <div className="text-center">
        <p className="font-outfit text-lg text-lo">No contributors yet for this period.</p>
        <p className="mt-2 text-sm text-dim">Sign in with GitHub to appear on the leaderboard.</p>
      </div>
    </div>
  );
}

interface TableClientProps {
  initialData: LeaderboardEntry[];
  currentMonthKey: string;
}

export function TableClient({ initialData, currentMonthKey }: TableClientProps) {
  const [period] = useQueryState(
    "period",
    parseAsStringLiteral(["weekly", "monthly", "allTime"]).withDefault("monthly").withOptions({ shallow: true }),
  );

  const swrKey = `leaderboard-${period === "monthly" ? `monthly-${currentMonthKey}` : period}`;

  // Preload other tabs on mount
  useEffect(() => {
    preload("leaderboard-weekly", () => getLeaderboard("weekly"));
    preload("leaderboard-allTime", () => getLeaderboard("allTime"));
    preload(`leaderboard-monthly-${currentMonthKey}`, () => getMonthlyLeaderboard(currentMonthKey));
  }, [currentMonthKey]);

  const { data: entries = initialData } = useSWR<LeaderboardEntry[]>(
    swrKey,
    () =>
      period === "monthly" ? getMonthlyLeaderboard(currentMonthKey) : getLeaderboard(period as "weekly" | "allTime"),
    {
      fallbackData: initialData,
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    },
  );

  if (entries.length === 0) return <EmptyState />;

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="glass min-h-110 overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-[rgba(48,54,61,0.5)]">
                <th className="px-6 py-4 text-left font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Rank
                </th>
                <th className="px-6 py-4 text-left font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Contributor
                </th>
                <th className="px-6 py-4 text-right font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Commits
                </th>
                <th className="px-6 py-4 text-right font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  PRs
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  return (
                    <motion.tr
                      key={entry.userId}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="border-b border-line transition-colors last:border-0 hover:bg-[rgba(48,54,61,0.3)]"
                    >
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm ${getRankBadgeClass(rank)}`}
                        >
                          {getRankIcon(rank) || `#${rank}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={entry.image ?? `https://github.com/${entry.username}.png`}
                            alt={entry.username}
                            width={40}
                            height={40}
                            className="rounded-full ring-2 ring-line"
                            unoptimized
                          />
                          <Link href={`https://github.com/${entry.username}`} target="_blank">
                            <span className="font-outfit font-semibold text-hi transition-colors hover:text-blue">
                              {entry.username}
                            </span>
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-lg font-bold text-lime">
                        {entry.commits.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-lg text-lo">
                        {entry.pullRequests.toLocaleString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        <AnimatePresence initial={false}>
          {entries.map((entry, index) => {
            const rank = index + 1;
            return (
              <motion.div
                key={entry.userId}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="glass relative overflow-hidden rounded-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
              >
                <div className="absolute top-4 right-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-sm ${getRankBadgeClass(rank)}`}
                  >
                    {getRankIcon(rank) || `#${rank}`}
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-3">
                  <Image
                    src={entry.image ?? `https://github.com/${entry.username}.png`}
                    alt={entry.username}
                    width={56}
                    height={56}
                    className="rounded-full ring-2 ring-line"
                    unoptimized
                  />
                  <Link href={`https://github.com/${entry.username}`} target="_blank">
                    <h3 className="font-outfit text-lg font-bold text-hi transition-colors hover:text-blue">
                      {entry.username}
                    </h3>
                  </Link>
                </div>
                <div className="flex justify-between gap-4">
                  <div className="flex-1 rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3">
                    <div className="mb-1 text-xs tracking-wider text-lo uppercase">Commits</div>
                    <div className="font-mono text-xl font-bold text-lime">{entry.commits.toLocaleString()}</div>
                  </div>
                  <div className="flex-1 rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3">
                    <div className="mb-1 text-xs tracking-wider text-lo uppercase">PRs</div>
                    <div className="font-mono text-xl font-bold text-lo">{entry.pullRequests.toLocaleString()}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
