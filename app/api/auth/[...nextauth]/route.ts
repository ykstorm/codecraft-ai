import type { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { authUnavailableResponse } from "@/lib/auth-unavailable";
import { isAuthConfigured } from "@/lib/env-validate";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// proxy.ts already answers 503 here when the auth variables are missing; the
// same check in the handler keeps the route honest on its own.
export function GET(req: NextRequest) {
  return isAuthConfigured() ? handlers.GET(req) : authUnavailableResponse();
}

export function POST(req: NextRequest) {
  return isAuthConfigured() ? handlers.POST(req) : authUnavailableResponse();
}
