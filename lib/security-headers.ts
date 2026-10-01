/**
 * Single source of truth for the HTTP security headers applied to every route.
 *
 * Imported by `next.config.ts`. There is intentionally no `vercel.json` headers
 * block any more — two sources drift, and the Next config applies in dev and
 * prod alike, so WebContainers get the same cross-origin isolation locally.
 *
 * Cross-origin isolation (COOP: same-origin + COEP: require-corp) is required:
 * WebContainers need `SharedArrayBuffer`, which is only exposed to
 * cross-origin-isolated documents. Do not loosen it.
 *
 * The Content-Security-Policy is shipped in **Report-Only** mode first. It does
 * not block anything; it reports would-be violations so the host allow-list can
 * be confirmed against the real preview network traffic before a later change
 * promotes it to an enforcing `Content-Security-Policy`.
 */

// WebContainer runtime + preview hosts. The in-tab VM and its preview iframe are
// served from these origins; everything the runtime fetches lives here.
const WEBCONTAINER_HOSTS = [
  "https://*.webcontainer-api.io",
  "https://*.staticblitz.com",
];

// Vercel Web Analytics + Speed Insights (kept in the root layout).
const VERCEL_SCRIPT_HOSTS = ["https://va.vercel-scripts.com"];
const VERCEL_CONNECT_HOSTS = ["https://*.vercel-insights.com"];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${WEBCONTAINER_HOSTS.join(
    " "
  )} ${VERCEL_SCRIPT_HOSTS.join(" ")}`,
  `worker-src 'self' blob: ${WEBCONTAINER_HOSTS.join(" ")}`,
  `connect-src 'self' ${WEBCONTAINER_HOSTS.join(
    " "
  )} wss://*.webcontainer-api.io wss://*.staticblitz.com ${VERCEL_CONNECT_HOSTS.join(
    " "
  )}`,
  "frame-src 'self' https://*.webcontainer-api.io https://*.staticblitz.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://github.com",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = [
  // Cross-origin isolation — required for WebContainers (SharedArrayBuffer).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
  // CSP in report-only mode — observe before enforcing.
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  // Defence in depth.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
] as const;
