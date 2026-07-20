import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { isValidSecret } from "@/lib/crypto";
import { getBearerToken } from "@/lib/utils.server";

type WebhookRouteOptions<T extends object> = {
  /** Shared secret the caller must present. Compared in constant time. */
  secret: string;
  /** How to read the token off the request. Defaults to the `Authorization: Bearer` header. */
  getToken?: (req: NextRequest) => string | null;
  /** The sync to run once the caller is authenticated. */
  run: () => Promise<T>;
  /** Human-readable summary of the run, echoed back to the admin panel. */
  message: (result: T) => string;
};

export function webhookRoute<T extends object>({
  secret,
  getToken = getBearerToken,
  run,
  message,
}: WebhookRouteOptions<T>) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    if (!isValidSecret(getToken(req), secret ?? null)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await run();
    return NextResponse.json({ ok: true, ...result, message: message(result) });
  };
}
