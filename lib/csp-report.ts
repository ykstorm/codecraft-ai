/**
 * Reading Content-Security-Policy violation reports for app/api/csp-report.
 *
 * Browsers send one of two shapes:
 * - report-uri: {"csp-report": {"effective-directive", "blocked-uri",
 *   "document-uri", "disposition", ...}} as application/csp-report.
 * - report-to (Reporting API): [{"type": "csp-violation", "body":
 *   {"effectiveDirective", "blockedURL", "documentURL", "disposition", ...}}]
 *   as application/reports+json.
 *
 * Only a few fields are kept: the directive, the blocked origin (or a keyword
 * such as "inline"), the page path without its query string, and the
 * disposition. Script samples and full URLs are never logged.
 */

/** Largest request body the endpoint reads. */
export const MAX_REPORT_BYTES = 8 * 1024;
/** At most this many reports are logged from one request. */
const MAX_REPORTS_PER_REQUEST = 10;
const MAX_FIELD_LENGTH = 120;

type CspReportSummary = {
  directive: string;
  blocked: string;
  page: string;
  disposition: string;
};

type Fields = Record<string, unknown>;

function isObject(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(fields: Fields, ...names: string[]): string {
  for (const name of names) {
    const value = fields[name];
    if (typeof value === "string" && value !== "") return value.slice(0, MAX_FIELD_LENGTH);
  }
  return "";
}

/** "https://example.com/x?y" becomes "https://example.com"; keywords stay. */
function originOrKeyword(value: string): string {
  try {
    const url = new URL(value);
    return url.origin !== "null" ? url.origin : url.protocol;
  } catch {
    return value;
  }
}

function pathOnly(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return "";
  }
}

function summarize(fields: Fields): CspReportSummary | null {
  const directive = text(fields, "effective-directive", "effectiveDirective", "violated-directive");
  if (!directive) return null;
  return {
    directive,
    blocked: originOrKeyword(text(fields, "blocked-uri", "blockedURL")),
    page: pathOnly(text(fields, "document-uri", "documentURL")),
    disposition: text(fields, "disposition"),
  };
}

/** The reports in a parsed request body, in either shape; [] when none. */
export function summarizeCspReports(payload: unknown): CspReportSummary[] {
  const bodies: unknown[] = [];
  if (isObject(payload) && isObject(payload["csp-report"])) {
    bodies.push(payload["csp-report"]);
  } else if (Array.isArray(payload)) {
    for (const item of payload) {
      if (isObject(item) && item.type === "csp-violation") bodies.push(item.body);
    }
  }
  return bodies
    .filter(isObject)
    .map(summarize)
    .filter((s): s is CspReportSummary => s !== null)
    .slice(0, MAX_REPORTS_PER_REQUEST);
}

/**
 * Read a request body as text, giving up as soon as it passes `max` bytes.
 * Returns null when the body is too large.
 */
export async function readBodyCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}
