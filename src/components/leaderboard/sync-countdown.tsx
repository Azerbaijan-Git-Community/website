"use client";

import { useEffect, useState } from "react";
import { PiArrowsClockwise } from "react-icons/pi";
import { formatTime, getTimeLeft } from "@/lib/utils.client";

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

export function SyncCountdown({ lastSync }: { lastSync: Date }) {
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

  return (
    <>
      <PiArrowsClockwise size={14} className={timeLeft === 0 ? "animate-spin text-blue" : ""} />
      <span>{timeLeft === 0 ? "Syncing..." : `Next sync in ${formatTime(timeLeft)}`}</span>{" "}
    </>
  );
}
