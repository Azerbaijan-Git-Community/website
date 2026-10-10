import { SYNC_INTERVAL_MS } from "./constants";

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
}

export function getLatestMonthKey(data: Record<string, unknown>): string {
  let latest = "";
  for (const key of Object.keys(data)) {
    if (key > latest) latest = key;
  }
  return latest;
}

export function getTimeLeft(lastSync: Date | null): number {
  if (!lastSync) return 0;
  const next = new Date(lastSync).getTime() + SYNC_INTERVAL_MS;
  return Math.max(0, next - Date.now());
}

// GitHub resizes avatars server-side via `s`; the default is 460px.
export function sizedGithubAvatar(src: string, size: number): string {
  try {
    const url = new URL(src);
    if (url.hostname !== "avatars.githubusercontent.com") return src;
    url.searchParams.set("s", String(size));
    return url.toString();
  } catch {
    return src;
  }
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
