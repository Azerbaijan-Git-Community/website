"use client";

import * as motion from "motion/react-client";
import Image from "next/image";
import type { Contributor } from "@/types/leaderboard";

interface MonthlyLeaderboardProps {
  contributors: Contributor[];
  sortBy: "monthly" | "total" | "newest";
}

export function MonthlyLeaderboard({ contributors, sortBy }: MonthlyLeaderboardProps) {
  // Sort contributors based on sortBy prop
  const sortedContributors = [...contributors].sort((a, b) => {
    if (sortBy === "monthly") {
      return b.monthlyCommits - a.monthlyCommits;
    } else if (sortBy === "total") {
      return b.totalCommits - a.totalCommits;
    } else {
      // newest
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    }
  });

  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) {
      return "bg-linear-to-br from-[#FFD700] to-[#FFA500] text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.5)]";
    } else if (rank === 2) {
      return "bg-linear-to-br from-[#C0C0C0] to-[#A8A8A8] text-black font-bold shadow-[0_0_15px_rgba(192,192,192,0.5)]";
    } else if (rank === 3) {
      return "bg-linear-to-br from-[#CD7F32] to-[#B87333] text-black font-bold shadow-[0_0_15px_rgba(205,127,50,0.5)]";
    }
    return "bg-surface text-lo border border-line";
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  return (
    <div className="w-full">
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <div className="glass overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
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
                  Monthly
                </th>
                <th className="px-6 py-4 text-right font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedContributors.map((contributor, index) => {
                const rank = index + 1;
                return (
                  <motion.tr
                    key={contributor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="border-b border-line transition-colors hover:bg-[rgba(48,54,61,0.3)]"
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
                          src={contributor.avatarUrl}
                          alt={contributor.username}
                          width={40}
                          height={40}
                          className="rounded-full ring-2 ring-line"
                          unoptimized
                        />
                        <span className="font-outfit font-semibold text-hi">{contributor.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-lg font-bold text-lime">
                      {contributor.monthlyCommits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-lg text-lo">
                      {contributor.totalCommits.toLocaleString()}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {sortedContributors.map((contributor, index) => {
          const rank = index + 1;
          return (
            <motion.div
              key={contributor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="glass relative overflow-hidden rounded-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              {/* Rank Badge - Top Right */}
              <div className="absolute top-4 right-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-sm ${getRankBadgeClass(rank)}`}
                >
                  {getRankIcon(rank) || `#${rank}`}
                </div>
              </div>

              {/* User Info */}
              <div className="mb-4 flex items-center gap-3">
                <Image
                  src={contributor.avatarUrl}
                  alt={contributor.username}
                  width={56}
                  height={56}
                  className="rounded-full ring-2 ring-line"
                  unoptimized
                />
                <div className="flex-1">
                  <h3 className="font-outfit text-lg font-bold text-hi">{contributor.username}</h3>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between gap-4">
                <div className="flex-1 rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3">
                  <div className="mb-1 text-xs tracking-wider text-lo uppercase">Monthly</div>
                  <div className="font-mono text-xl font-bold text-lime">
                    {contributor.monthlyCommits.toLocaleString()}
                  </div>
                </div>
                <div className="flex-1 rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3">
                  <div className="mb-1 text-xs tracking-wider text-lo uppercase">Total</div>
                  <div className="font-mono text-xl font-bold text-lo">{contributor.totalCommits.toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
