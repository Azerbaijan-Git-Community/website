"use client";

import { useEffect, useState } from "react";
import { PiArrowsClockwise } from "react-icons/pi";
import { formatTime, getTimeLeft } from "@/lib/utils.client";

export function SyncCountdown({ lastSync }: { lastSync: Date }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const lastSyncMs = lastSync.getTime();

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(new Date(lastSyncMs)));
    update(); // immediate sync on mount / lastSync change

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [lastSyncMs]);

  const label =
    timeLeft === null ? "Next sync in --:--" : timeLeft === 0 ? "Syncing..." : `Next sync in ${formatTime(timeLeft)}`;

  return (
    <>
      <PiArrowsClockwise size={14} className={timeLeft === 0 ? "animate-spin text-blue" : ""} />
      <span>{label}</span>{" "}
    </>
  );
}
