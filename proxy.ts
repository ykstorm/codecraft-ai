import NextAuth from "next-auth";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  authRoutes,
} from "@/routes";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

  // A publicRoutes entry ending in "/*" matches any path under that prefix,
  // so the dynamic /playground/[id] routes are public without enumerating slugs.
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.endsWith("/*")) {
      return nextUrl.pathname.startsWith(route.slice(0, -1));
    }
    return nextUrl.pathname === route;
  });

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    // 307 keeps the method (and matches the smoke test); the default would be 302.
    return Response.redirect(new URL("/auth/sign-in", nextUrl), 307);
  }

  return null;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
