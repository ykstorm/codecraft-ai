import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Liveness / freshness probe. `updated_at` is the server date at request time. */
export function GET() {
  const now = new Date();
  return NextResponse.json(
    {
      updated_at: now.toISOString().slice(0, 10),
      timestamp: now.toISOString(),
      service: "codecraft",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
