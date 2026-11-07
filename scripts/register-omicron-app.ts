import * as z from "zod/mini";

// One-off: registers this site as an OAuth app on the Omicron instance and prints its credentials.
// Run once per environment: node --env-file=.env scripts/register-omicron-app.ts

async function main() {
  const { OMICRON_ORIGIN, NEXT_PUBLIC_BASE_URL } = process.env;
  if (!OMICRON_ORIGIN || !NEXT_PUBLIC_BASE_URL) throw new Error("Set OMICRON_ORIGIN and NEXT_PUBLIC_BASE_URL first.");

  const res = await fetch(new URL("/api/v1/apps", OMICRON_ORIGIN), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Azerbaijan GitHub Community",
      redirect_uris: [new URL("/api/omicron/callback", NEXT_PUBLIC_BASE_URL).toString()],
      scopes: "read:accounts webhooks:posts",
      website: NEXT_PUBLIC_BASE_URL,
    }),
  });
  if (!res.ok) throw new Error(`Registration failed (${res.status}): ${await res.text()}`);

  const app = z.parse(z.object({ client_id: z.string(), client_secret: z.string() }), await res.json());
  console.log(`OMICRON_CLIENT_ID="${app.client_id}"\nOMICRON_CLIENT_SECRET="${app.client_secret}"`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
