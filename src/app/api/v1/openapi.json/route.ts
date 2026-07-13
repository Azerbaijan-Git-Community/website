import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/api/openapi";
import { handleOptions } from "@/lib/api/response";

// The spec is deterministic — not rate limited, and cacheable at the edge.
export function GET() {
  return NextResponse.json(buildOpenApiDocument(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const OPTIONS = () => handleOptions();
