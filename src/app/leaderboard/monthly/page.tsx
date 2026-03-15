"use client";

import * as motion from "motion/react-client";
import Image from "next/image";
import { useState } from "react";
import { MonthlyLeaderboard } from "@/components/leaderboard/MonthlyLeaderboard";
import { MOCK_CONTRIBUTORS } from "@/lib/mock/leaderboard";

type SortBy = "monthly" | "total" | "newest";

// Static months for selector (December 2024 - July 2024)
const MONTHS = [
  { value: "2024-12", label: "December 2024" },
  { value: "2024-11", label: "November 2024" },
  { value: "2024-10", label: "October 2024" },
  { value: "2024-09", label: "September 2024" },
  { value: "2024-08", label: "August 2024" },
  { value: "2024-07", label: "July 2024" },
];

export default function MonthlyLeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("2024-12");

  // Get top 3 for podium
  const topThree = [...MOCK_CONTRIBUTORS]
    .sort((a, b) => {
      if (sortBy === "monthly") return b.monthlyCommits - a.monthlyCommits;
      if (sortBy === "total") return b.totalCommits - a.totalCommits;
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    })
    .slice(0, 3);

  const sortTabs: { id: SortBy; label: string }[] = [
    { id: "monthly", label: "This Month" },
    { id: "total", label: "All Time" },
    { id: "newest", label: "Newest" },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            Community Rankings
          </span>
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Monthly <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-lo">
            Celebrating our top contributors pushing Azerbaijan&apos;s open-source future forward.
          </p>

          {/* Month Selector */}
          <div className="mx-auto max-w-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="glass w-full cursor-pointer rounded-lg px-4 py-3 font-outfit text-base font-semibold text-hi transition-all hover:border-blue focus:ring-2 focus:ring-blue focus:outline-none"
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value} className="bg-surface text-hi">
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Podium Section - Top 3 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="glass flex flex-col items-center rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] md:mt-8">
                <div className="relative mb-4">
                  <Image
                    src={topThree[1].avatarUrl}
                    alt={topThree[1].username}
                    width={80}
                    height={80}
                    className="rounded-full ring-4 ring-[#C0C0C0]"
                    unoptimized
                  />
                  <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#C0C0C0] to-[#A8A8A8] text-xl font-bold text-black shadow-[0_0_20px_rgba(192,192,192,0.6)]">
                    🥈
                  </div>
                </div>
                <h3 className="mb-1 font-outfit text-xl font-bold text-hi">{topThree[1].username}</h3>
                <div className="mb-3 text-sm text-lo">2nd Place</div>
                <div className="w-full rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3 text-center">
                  <div className="mb-1 text-xs tracking-wider text-lo uppercase">Monthly Commits</div>
                  <div className="font-mono text-2xl font-bold text-lime">
                    {topThree[1].monthlyCommits.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="glass relative flex flex-col items-center overflow-hidden rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] before:absolute before:top-0 before:right-0 before:left-0 before:h-1 before:bg-linear-to-r before:from-blue before:to-purple">
                <div className="relative mb-4">
                  <Image
                    src={topThree[0].avatarUrl}
                    alt={topThree[0].username}
                    width={96}
                    height={96}
                    className="rounded-full ring-4 ring-[#FFD700]"
                    unoptimized
                  />
                  <div className="absolute -right-2 -bottom-2 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#FFD700] to-[#FFA500] text-2xl font-bold text-black shadow-[0_0_25px_rgba(255,215,0,0.8)]">
                    🥇
                  </div>
                </div>
                <h3 className="mb-1 font-outfit text-2xl font-bold text-hi">{topThree[0].username}</h3>
                <div className="text-gradient mb-3 text-sm font-semibold">Champion</div>
                <div className="w-full rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-4 text-center">
                  <div className="mb-1 text-xs tracking-wider text-lo uppercase">Monthly Commits</div>
                  <div className="font-mono text-3xl font-bold text-lime">
                    {topThree[0].monthlyCommits.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="glass flex flex-col items-center rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] md:mt-8">
                <div className="relative mb-4">
                  <Image
                    src={topThree[2].avatarUrl}
                    alt={topThree[2].username}
                    width={80}
                    height={80}
                    className="rounded-full ring-4 ring-[#CD7F32]"
                    unoptimized
                  />
                  <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#CD7F32] to-[#B87333] text-xl font-bold text-black shadow-[0_0_20px_rgba(205,127,50,0.6)]">
                    🥉
                  </div>
                </div>
                <h3 className="mb-1 font-outfit text-xl font-bold text-hi">{topThree[2].username}</h3>
                <div className="mb-3 text-sm text-lo">3rd Place</div>
                <div className="w-full rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3 text-center">
                  <div className="mb-1 text-xs tracking-wider text-lo uppercase">Monthly Commits</div>
                  <div className="font-mono text-2xl font-bold text-lime">
                    {topThree[2].monthlyCommits.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sorting Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex justify-center"
        >
          <div className="glass inline-flex gap-1 rounded-lg p-1">
            {sortTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id)}
                className={`rounded-md px-6 py-2 font-outfit font-semibold transition-all ${
                  sortBy === tab.id
                    ? "bg-green text-white shadow-[0_0_15px_rgba(46,160,67,0.4)]"
                    : "text-lo hover:text-hi"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <MonthlyLeaderboard contributors={MOCK_CONTRIBUTORS} sortBy={sortBy} />
        </motion.div>
      </div>
    </div>
  );
}
