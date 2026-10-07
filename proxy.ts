import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  isPublicRoute,
} from "@/routes";
import { authUnavailableResponse } from "@/lib/auth-unavailable";
import { isAuthConfigured } from "@/lib/env-validate";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

const gate = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
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

  if (!isLoggedIn && !isPublicRoute(nextUrl.pathname)) {
    // 307 keeps the method (and matches the smoke test); the default would be 302.
    return Response.redirect(new URL("/auth/sign-in", nextUrl), 307);
  }

  return null;
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // Without the auth variables there is nothing to sign in to. Public pages
  // pass straight through, and every other path, /auth/sign-in and
  // /api/auth/* included, gets a plain 503 instead of the 500 Auth.js would
  // raise. The check runs per request, so it follows the runtime environment.
  if (!isAuthConfigured()) {
    return isPublicRoute(req.nextUrl.pathname)
      ? NextResponse.next()
      : authUnavailableResponse();
  }
  return gate(req, event);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
