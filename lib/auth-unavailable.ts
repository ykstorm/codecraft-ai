/**
 * The answer for anything that needs sign-in on a deployment without the auth
 * variables (see isAuthConfigured in lib/env-validate.ts): a plain page with
 * status 503, instead of the 500 Auth.js raises when its secret is missing.
 */

export const AUTH_UNAVAILABLE_MESSAGE = "Sign-in is not configured on this deployment";

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${AUTH_UNAVAILABLE_MESSAGE}</title>
</head>
<body style="font-family: ui-monospace, monospace; max-width: 40rem; margin: 4rem auto; padding: 0 1rem; line-height: 1.6">
<h1 style="font-size: 1.25rem">${AUTH_UNAVAILABLE_MESSAGE}</h1>
<p>This deployment runs the playground only. It has no sign-in and no database, so the dashboard and settings pages are not available here.</p>
<p><a href="/playgrounds">Open the playgrounds</a></p>
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
