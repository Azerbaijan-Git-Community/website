import { http, HttpResponse } from "msw";
import { server } from "./msw";

const INFRA = "https://dash.better-auth.com";
// NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL in the test env.
const IDENTIFY = "https://kv.better-auth.com/projects/test";

/** Sentinel's browser client identifies the visitor as soon as `auth-client` is imported in a DOM. */
export const sentinelIdentifyHandlers = [http.post(`${IDENTIFY}/identify`, () => HttpResponse.json({ success: true }))];

type SecurityVerdict = { action: "allow" } | { action: "block" | "challenge"; reason: string };

/** Fake Better Auth Infra (Sentinel/Dash) security API, which the auth server plugins call on sign-in. */
export function useFakeBetterAuthInfra(verdict: SecurityVerdict = { action: "allow" }) {
  const securityChecks: unknown[] = [];
  server.use(
    http.post(`${INFRA}/security/check`, async ({ request }) => {
      securityChecks.push(await request.json());
      return HttpResponse.json(verdict);
    }),
    http.post(`${INFRA}/events/track`, () => new HttpResponse(null, { status: 204 })),
  );
  return { securityChecks };
}
