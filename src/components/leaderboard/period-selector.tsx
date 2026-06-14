"use client";

import { type LeaderboardPeriod } from "@/data/leaderboard/get";

const TABS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "This Month" },
  // It turned out that the "all time" leaderboard is actually the last year, so I renamed it to avoid confusion
  // Can't change the API response, so keeping the id as "allTime"
  { id: "allTime", label: "Last Year" },
];

type PeriodSelectorProps = {
  period: LeaderboardPeriod;
  onTabChange: (tab: LeaderboardPeriod) => void;
};

export function PeriodSelector({ period, onTabChange }: PeriodSelectorProps) {
  return (
    <div className="mb-8 flex justify-center">
      <div className="glass inline-flex gap-1 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
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
