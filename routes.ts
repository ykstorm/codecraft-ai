// Public routes, no authentication. The landing page, the gallery, and the
// live playgrounds are deliberately open so the editor opens without signing in.
// An entry ending in "/*" matches any path under that prefix (see
// isPublicRoute below), which covers the dynamic /playground/[id] routes.
const publicRoutes: string[] = [
  "/",
  "/playgrounds",
  "/playground/*",
  "/api/health",
  "/api/now",
  // Browsers post CSP violation reports here without any session.
  "/api/csp-report",
];

// Auth routes. A signed-in user hitting one of these is redirected home.
export const authRoutes: string[] = [
  "/auth/sign-in",
];

// Pages that need a signed-in user. An entry is the path itself and everything
// under it. Keep this in step with the pages under app/: tests/auth-unavailable
// fails when a page is neither public nor listed here or in authRoutes.
export const protectedRoutes: string[] = [
  "/dashboard",
  "/settings",
];

// Anything under this prefix (the NextAuth handlers) bypasses the auth gate.
export const apiAuthPrefix: string = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/";

function isAtOrUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * True for the paths that depend on sign-in working: the protected pages, the
 * sign-in page and the NextAuth API. Any other path, public or unknown, does
 * not, so the proxy leaves it to Next (an unknown one then gets the 404 page).
 */
export function needsSignIn(pathname: string): boolean {
  return (
    protectedRoutes.some((route) => isAtOrUnder(pathname, route)) ||
    authRoutes.includes(pathname) ||
    isAtOrUnder(pathname, apiAuthPrefix)
  );
}

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith("/*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route;
  });
}
