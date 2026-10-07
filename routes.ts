// Public routes — no authentication. The landing page, the gallery, and the
// live playgrounds are deliberately open so the editor opens without signing in.
// An entry ending in "/*" matches any path under that prefix (see isPublicRoute
// in proxy.ts), which covers the dynamic /playground/[id] routes.
export const publicRoutes: string[] = [
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

// Anything under this prefix (the NextAuth handlers) bypasses the auth gate.
export const apiAuthPrefix: string = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/";
