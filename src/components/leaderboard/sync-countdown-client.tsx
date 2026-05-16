"use client";

import { useEffect, useState } from "react";
import { getTimeLeft } from "@/lib/utils.client";

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SyncCountdownClient({ lastSync }: { lastSync: Date }) {
  const [timeLeft, setTimeLeft] = useState<number>(getTimeLeft(lastSync, SYNC_INTERVAL_MS));

  useEffect(() => {
    const initial = setTimeout(() => {
      setTimeLeft(getTimeLeft(lastSync, SYNC_INTERVAL_MS));
    }, 0);
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(lastSync, SYNC_INTERVAL_MS));
    }, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [lastSync]);

  return formatTime(timeLeft);
}
