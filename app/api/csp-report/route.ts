import {
  MAX_REPORT_BYTES,
  readBodyCapped,
  summarizeCspReports,
} from "@/lib/csp-report";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Receives the report-only CSP's violation reports (lib/security-headers.ts)
 * and logs one line per report with a few fields; the body itself is never
 * logged. Bodies over 8 KB are refused with 413, bodies that are not a CSP
 * report with 400.
 */
export async function POST(request: Request): Promise<Response> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_REPORT_BYTES) return new Response(null, { status: 413 });

  const body = await readBodyCapped(request, MAX_REPORT_BYTES);
  if (body === null) return new Response(null, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }

  const reports = summarizeCspReports(payload);
  if (reports.length === 0) return new Response(null, { status: 400 });
  for (const report of reports) console.warn(`csp-report ${JSON.stringify(report)}`);
  return new Response(null, { status: 204 });
}
