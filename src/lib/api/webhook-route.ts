import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { isValidSecret } from "@/lib/crypto";
import { getBearerToken } from "@/lib/utils.server";

type WebhookRouteOptions<T extends object> = {
  /** Shared secret the caller must present as `Authorization: Bearer`. Compared in constant time. */
  secret: string;
  /** The sync to run once the caller is authenticated. */
  run: () => Promise<T>;
  /** Human-readable summary of the run, echoed back to the admin panel. */
  message: (result: T) => string;
};

export function webhookRoute<T extends object>({ secret, run, message }: WebhookRouteOptions<T>) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    if (!isValidSecret(getBearerToken(req), secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await run();
    return NextResponse.json({ ok: true, ...result, message: message(result) });
  };
}
