"use client";

import { useQueryState } from "nuqs";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { FaMedal } from "react-icons/fa";
import { type LeaderboardEntry, getMonthlyLeaderboard } from "@/data/leaderboard/get";

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

function PodiumCard({
  entry,
  config,
  mt,
}: {
  entry: LeaderboardEntry;
  config: (typeof MEDAL_CONFIG)[number];
  mt?: string;
}) {
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
          unoptimized
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

type PodiumClientProps = {
  initialData: LeaderboardEntry[];
  currentMonthKey: string;
};

export function PodiumClient({ initialData, currentMonthKey }: PodiumClientProps) {
  const [month] = useQueryState("month", { defaultValue: currentMonthKey, shallow: true });

  const { data = [] } = useSWR<LeaderboardEntry[]>(
    `leaderboard-podium-${month}`,
    () => getMonthlyLeaderboard(month).then((d) => d.slice(0, 3)),
    {
      fallbackData: month === currentMonthKey ? initialData : [],
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    },
  );

  const [first, second, third] = data;

  if (data.length === 0) return null;
  if (data.length === 1) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <PodiumCard entry={first} config={MEDAL_CONFIG[0]} />
        </div>
      </div>
    );
  }
  if (data.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-6 md:mx-auto md:max-w-2xl md:grid-cols-2">
        <PodiumCard entry={second} config={MEDAL_CONFIG[1]} mt="md:mt-8" />
        <PodiumCard entry={first} config={MEDAL_CONFIG[0]} />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <PodiumCard entry={second} config={MEDAL_CONFIG[1]} mt="md:mt-8" />
      <PodiumCard entry={first} config={MEDAL_CONFIG[0]} />
      <PodiumCard entry={third!} config={MEDAL_CONFIG[2]} mt="md:mt-8" />
    </div>
  );
}
