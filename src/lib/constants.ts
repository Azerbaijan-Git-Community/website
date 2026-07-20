export const SYNC_INTERVAL_MS = 60 * 60 * 1000;

/** Manual sync targets exposed on the admin page. */
export const SYNC_TARGETS = ["blog", "showcase", "github"] as const;
export type SyncTarget = (typeof SYNC_TARGETS)[number];

/** GitHub org that owns the community repos synced into the database. */
export const GITHUB_ORG = "Azerbaijan-Git-Community";
