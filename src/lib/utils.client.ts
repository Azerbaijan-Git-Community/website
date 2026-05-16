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

export function getTimeLeft(lastSync: Date | null, SYNC_INTERVAL_MS: number): number {
  if (!lastSync) return 0;
  const next = new Date(lastSync).getTime() + SYNC_INTERVAL_MS;
  return Math.max(0, next - Date.now());
}
