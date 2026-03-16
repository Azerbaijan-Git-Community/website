"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { type LeaderboardPeriod } from "@/data/leaderboard/get";

const TABS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "This Month" },
  { id: "allTime", label: "All Time" },
];

export function LeaderboardTabs() {
  const [period, setPeriod] = useQueryState(
    "period",
    parseAsStringLiteral(["weekly", "monthly", "allTime"]).withDefault("monthly").withOptions({ shallow: true }),
  );

  return (
    <div className="mb-8 flex justify-center">
      <div className="glass inline-flex gap-1 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className={`rounded-md px-6 py-2 font-outfit font-semibold transition-all ${
              period === tab.id ? "bg-green text-white shadow-[0_0_15px_rgba(46,160,67,0.4)]" : "text-lo hover:text-hi"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
