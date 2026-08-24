"use client";

import type { LeaderboardPeriod } from "@/data/leaderboard/get";

// Captured once at module load, not during render — reading the clock inside render would bake the
// value into the Cache Components prerender. Refreshes on any reload/redeploy, which is well within
// the resolution we need: the "allTime" window only rolls over to the new year at the next sync.
const CURRENT_YEAR = new Date().getUTCFullYear();

// The "allTime" period is synced as a fixed calendar-year window (Jan 1 → Dec 31), so it reads as
// the current year and resets every January. Keeping the id as "allTime" to avoid breaking the API.
const TABS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "This Month" },
  { id: "allTime", label: String(CURRENT_YEAR) },
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
            className={`rounded-md px-6 py-2 font-outfit font-semibold transition-[color,background-color,box-shadow] ${
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
