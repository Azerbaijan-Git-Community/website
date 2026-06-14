export const SYNC_INTERVAL_MS = 60 * 60 * 1000;

/** Manual sync targets exposed on the admin page. */
export const SYNC_TARGETS = ["blog", "showcase", "github"] as const;
export type SyncTarget = (typeof SYNC_TARGETS)[number];
