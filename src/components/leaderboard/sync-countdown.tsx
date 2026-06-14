"use client";

import { useEffect, useState } from "react";
import { PiArrowsClockwise } from "react-icons/pi";
import { formatTime, getTimeLeft } from "@/lib/utils.client";

export function SyncCountdown({ lastSync }: { lastSync: Date }) {
  const [timeLeft, setTimeLeft] = useState<number>(() => getTimeLeft(lastSync));

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(lastSync));
    update(); // immediate sync on mount / lastSync change

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [lastSync]);

  return (
    <>
      <PiArrowsClockwise size={14} className={timeLeft === 0 ? "animate-spin text-blue" : ""} />
      <span>{timeLeft === 0 ? "Syncing..." : `Next sync in ${formatTime(timeLeft)}`}</span>{" "}
    </>
  );
}
