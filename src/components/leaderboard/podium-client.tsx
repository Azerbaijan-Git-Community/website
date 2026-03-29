"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaMedal } from "react-icons/fa";
import { type LeaderboardEntry } from "@/data/leaderboard/get";
import { MonthSelector } from "./month-selector";

type PodiumClientProps = {
  allData: Record<string, LeaderboardEntry[]>;
  currentMonthKey: string;
  availableMonths: string[];
};

const PODIUM_ORDER = [1, 0, 2];

export function PodiumClient({ allData, currentMonthKey, availableMonths }: PodiumClientProps) {
  const [month, setMonth] = useState(currentMonthKey);

  const months = Object.keys(allData).sort().reverse();
  const data = allData[month]?.length ? allData[month] : (allData[months.find((m) => m < month) ?? months[0]] ?? []);

  return (
    <>
      <div className="mb-8">
        <MonthSelector months={availableMonths} month={month} onMonthChange={setMonth} />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PODIUM_ORDER.map((i) => (
          <PodiumCard
            key={data[i].username}
            entry={data[i]}
            config={MEDAL_CONFIG[i]}
            mt={i !== 0 ? "md:mt-8" : undefined}
          />
        ))}
      </div>
    </>
  );
}

const MEDAL_CONFIG = [
  {
    ring: "ring-[#FFD700]",
    gradient: "from-[#FFD700] to-[#FFA500]",
    glow: "shadow-[0_0_25px_rgba(255,215,0,0.8)]",
    label: "Champion",
    size: 96,
    badgeSize: "h-12 w-12 text-2xl",
    isFirst: true,
    icon: "🥇",
  },
  {
    ring: "ring-[#C0C0C0]",
    gradient: "from-[#C0C0C0] to-[#A8A8A8]",
    glow: "shadow-[0_0_20px_rgba(192,192,192,0.6)]",
    label: "2nd Place",
    size: 80,
    badgeSize: "h-10 w-10 text-xl",
    isFirst: false,
    icon: <FaMedal className="h-5 w-5" />,
  },
  {
    ring: "ring-[#CD7F32]",
    gradient: "from-[#CD7F32] to-[#B87333]",
    glow: "shadow-[0_0_20px_rgba(205,127,50,0.6)]",
    label: "3rd Place",
    size: 80,
    badgeSize: "h-10 w-10 text-xl",
    isFirst: false,
    icon: "🥉",
  },
] as const;

type PodiumCardProps = {
  entry: LeaderboardEntry;
  config: (typeof MEDAL_CONFIG)[number];
  mt?: string;
};

function PodiumCard({ entry, config, mt }: PodiumCardProps) {
  return (
    <div
      className={`glass flex flex-col items-center rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${mt ?? ""} ${
        config.isFirst
          ? "relative overflow-hidden before:absolute before:top-0 before:right-0 before:left-0 before:h-1 before:bg-linear-to-r before:from-blue before:to-purple"
          : ""
      }`}
    >
      <div className="relative mb-4">
        <Image
          src={entry.image ?? `https://github.com/${entry.username}.png`}
          alt={entry.username}
          width={config.size}
          height={config.size}
          className={`rounded-full ring-4 ${config.ring}`}
          quality={100}
          loading="eager"
        />
        <div
          className={`absolute -right-2 -bottom-2 flex items-center justify-center rounded-full bg-linear-to-br ${config.gradient} font-bold text-black ${config.glow} ${config.badgeSize}`}
          aria-hidden="true"
        >
          {config.icon}
        </div>
      </div>
      <Link href={`https://github.com/${entry.username}`} target="_blank" className="text-center">
        <h3 className={`mb-1 font-outfit font-bold text-hi ${config.isFirst ? "text-2xl" : "text-xl"}`}>
          {entry.username}
        </h3>
      </Link>
      <div className={`mb-3 text-sm ${config.isFirst ? "text-gradient font-semibold" : "text-lo"}`}>{config.label}</div>
      <div
        className={`w-full rounded-lg border border-line bg-[rgba(13,17,23,0.5)] text-center ${config.isFirst ? "p-4" : "p-3"}`}
      >
        <div className="mb-1 text-xs tracking-wider text-lo uppercase">Commits</div>
        <div className={`font-mono font-bold text-lime ${config.isFirst ? "text-3xl" : "text-2xl"}`}>
          {entry.commits.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
