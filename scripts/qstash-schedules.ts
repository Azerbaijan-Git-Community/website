import { Client } from "@upstash/qstash";

// Runs after `next build`. Schedules use fixed IDs, so re-running updates them in place.
const schedules = [{ id: "leaderboard-sync", path: "/api/webhooks/leaderboard", cron: "0 * * * *" }];

async function main() {
  const { QSTASH_TOKEN, VERCEL_ENV, NEXT_PUBLIC_BASE_URL, CRON_SECRET } = process.env;

  if (!QSTASH_TOKEN) return console.log("[qstash] QSTASH_TOKEN not set, skipping schedule sync");
  if (VERCEL_ENV && VERCEL_ENV !== "production") return console.log(`[qstash] ${VERCEL_ENV} build, skipping`);

  const baseUrl = new URL(NEXT_PUBLIC_BASE_URL);
  if (["localhost", "127.0.0.1"].includes(baseUrl.hostname)) return console.log("[qstash] local URL, skipping");

  const client = new Client({ baseUrl: "https://qstash-eu-central-1.upstash.io", token: QSTASH_TOKEN });

  for (const { id, path, cron } of schedules) {
    const destination = new URL(path, baseUrl).toString();
    await client.schedules.create({
      scheduleId: id,
      destination,
      cron,
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      redact: { header: ["Authorization"] },
      retries: 2,
    });
    console.log(`[qstash] ${id}: ${cron} -> ${destination}`);
  }
}

main().catch((error: unknown) => console.warn("[qstash] schedule sync failed:", error));
