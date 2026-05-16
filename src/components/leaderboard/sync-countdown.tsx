import { Suspense } from "react";
import { PiArrowsClockwise } from "react-icons/pi";
import { getTimeLeft } from "@/lib/utils.client";
import { SyncCountdownClient } from "./sync-countdown-client";

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

export function SyncCountdown({ lastSync }: { lastSync: Date }) {
  const timeLeftMs = getTimeLeft(lastSync, SYNC_INTERVAL_MS);

  return (
    <div className="mb-5 flex justify-center">
      <div className="flex items-center gap-1.5 text-sm text-dim">
        <PiArrowsClockwise size={14} className={timeLeftMs === 0 ? "animate-spin text-blue" : ""} />
        <span>
          {timeLeftMs === 0 ? (
            "Syncing..."
          ) : (
            <>
              Next sync in{" "}
              <Suspense fallback={"00:00"}>
                <SyncCountdownClient lastSync={lastSync} />
              </Suspense>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
