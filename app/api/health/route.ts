import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Liveness probe used by the Docker healthcheck. */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
