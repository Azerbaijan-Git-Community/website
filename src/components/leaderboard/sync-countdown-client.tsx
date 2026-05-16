"use client";

import { useEffect, useState } from "react";
import { formatTime, getTimeLeft } from "@/lib/utils.client";

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

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
