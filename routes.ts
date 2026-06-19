/**
 * Routes accessible to the public — no authentication required.
 *
 * The landing page, the playground list, and the live WebContainer playgrounds
 * are deliberately public: codecraft is a portfolio demo and a recruiter must be
 * able to open the editor without signing in. An entry that ends in "/*" matches
 * any path under that prefix (see `isPublicRoute` in middleware.ts), which is how
 * the dynamic `/playground/[id]` routes are covered.
 *
 * @type {string[]}
 */
export const publicRoutes: string[] = [
  "/",
  "/playgrounds",
  "/playground/*",
];

/**
 * Routes that require authentication.
 * @type {string[]}
 */
export const protectedRoutes: string[] = [
  "/dashboard",
  "/settings",
];

/**
 * Auth routes. A signed-in user hitting one of these is redirected home.
 * @type {string[]}
 */
export const authRoutes: string[] = [
  "/auth/sign-in",
];

/**
 * Routes under this prefix (the NextAuth handlers) always bypass the auth gate.
 * @type {string}
 */
export const apiAuthPrefix: string = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/"; // redirect home after login
