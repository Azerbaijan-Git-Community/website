import { type NextRequest, NextResponse } from "next/server";
import { isValidOmicronSignature, OmicronEventSchema, OmicronRequestError } from "@/lib/omicron";
import { prisma } from "@/lib/prisma";
import { disconnectOmicron, syncPost } from "@/lib/sync/sync-omicron";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(req: NextRequest) {
  const subscriptionId = req.headers.get("x-omicron-subscription");
  const body = await req.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // 410 tells Omicron to end the connection: this is how it learns a member disconnected here.
  const connection = subscriptionId ? await prisma.omicronConnection.findUnique({ where: { subscriptionId } }) : null;
  if (!connection?.webhookSecret) return NextResponse.json({ error: "Unknown subscription" }, { status: 410 });

  if (!isValidOmicronSignature(connection.webhookSecret, req.headers.get("x-omicron-signature"), body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const event = OmicronEventSchema.safeParse(payload);
  if (!event.success || event.data.username !== connection.username) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.data.event === "connection.revoked") {
    await disconnectOmicron(connection.userId);
    return NextResponse.json({ ok: true });
  }
  if (!event.data.postId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    await syncPost(connection, event.data.postId);
  } catch (error) {
    if (!(error instanceof OmicronRequestError)) throw error;
    // Omicron retries anything but 2xx and 410.
    return NextResponse.json({ error: "Could not read the post" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
