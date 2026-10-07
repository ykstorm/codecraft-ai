/**
 * The answer for anything that needs sign-in on a deployment without the auth
 * variables (see isAuthConfigured in lib/env-validate.ts): a plain page with
 * status 503, instead of the 500 Auth.js raises when its secret is missing.
 */

export const AUTH_UNAVAILABLE_MESSAGE = "Sign-in is not configured on this deployment";

// The proxy answers with this page directly, so it cannot load the app's
// stylesheet. These are the tokens and page rules of app/globals.css, copied;
// tests/auth-unavailable.test.ts fails when a value here drifts from that file.
const STYLE = `
:root {
  color-scheme: light;
  --ground: #ecebe6; --surface: #f5f4f0; --ink: #17181a; --line: #d3d0c7;
  --accent: #9a4a10; --accent-strong: #73360a; --radius: 4px;
  --depth: inset 0 1px 0 color-mix(in srgb, var(--accent) 14%, transparent), 0 24px 60px -36px rgba(0, 0, 0, 0.5);
  --font-ui: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --ground: #0b0c0e; --surface: #111316; --ink: #e9e6de; --line: #23262c;
    --accent: #f2a93b; --accent-strong: #ffc266;
  }
}
* { box-sizing: border-box; margin: 0; }
body { background: var(--ground); color: var(--ink); font-family: var(--font-ui); line-height: 1.55; }
.page { max-width: 46rem; margin-inline: auto; padding: 24px 16px 64px; }
nav { display: flex; flex-wrap: wrap; gap: 8px 16px; }
a { color: var(--accent); text-underline-offset: 3px; transition: color 150ms ease; }
a:hover { color: var(--accent-strong); }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.site-name { font-weight: 600; }
h1 { margin: 24px 0 4px; font-size: 1.5rem; font-weight: 600; }
.panel { margin-top: 16px; padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--depth); }
.panel > * + * { margin-top: 12px; }
@media (prefers-reduced-motion: reduce) { a { transition: none; } }
`;

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${AUTH_UNAVAILABLE_MESSAGE}</title>
<style>${STYLE}</style>
</head>
<body>
<div class="page">
<nav aria-label="Site"><a href="/" class="site-name">Codecraft</a><a href="/playgrounds">Playgrounds</a></nav>
<main>
<h1>${AUTH_UNAVAILABLE_MESSAGE}</h1>
<section class="panel">
<p>This deployment runs the playground only. It has no sign-in and no database, so the dashboard and settings pages are not available here.</p>
<p><a href="/playgrounds">Open the playgrounds</a></p>
</section>
</main>
</div>
</body>
</html>
`;

export function authUnavailableResponse(): Response {
  return new Response(PAGE, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
