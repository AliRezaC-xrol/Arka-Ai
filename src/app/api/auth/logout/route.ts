/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  invalidateSession,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

async function handleLogout(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload?.sessionToken) {
      await invalidateSession(payload.sessionToken);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/login", appUrl));
  clearSessionCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
