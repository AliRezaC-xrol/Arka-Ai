/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  setSessionCookie,
  upsertGoogleUser,
} from "@/lib/auth";
import {
  exchangeGoogleCodeForTokens,
  fetchGoogleUserProfile,
  getGoogleConfig,
  OAUTH_STATE_COOKIE_NAME,
  sanitizeReturnTo,
} from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { appUrl } = getGoogleConfig();

  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // 1. Handle user cancellation or OAuth error
  if (error) {
    console.warn("Google OAuth error response:", error);
    if (error === "access_denied" || error.includes("cancel")) {
      return NextResponse.redirect(new URL("/login?error=cancelled", appUrl));
    }
    return NextResponse.redirect(new URL("/login?error=oauth_failed", appUrl));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_code", appUrl));
  }

  // 2. Validate state cookie (CSRF protection)
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!stateCookie || stateCookie !== state) {
    console.warn("Google OAuth state mismatch or missing cookie");
    return NextResponse.redirect(new URL("/login?error=invalid_state", appUrl));
  }

  // 3. Decode returnTo from state
  let returnTo = "/chat";
  try {
    const parsedState = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    );
    returnTo = sanitizeReturnTo(parsedState.returnTo);
  } catch (err) {
    console.warn("Failed to parse state json:", err);
  }

  try {
    // 4. Exchange code for Google tokens
    const tokens = await exchangeGoogleCodeForTokens(code);

    // 5. Fetch profile from Google
    const profile = await fetchGoogleUserProfile(tokens.access_token);

    if (!profile.email || !profile.googleId) {
      return NextResponse.redirect(new URL("/login?error=missing_profile", appUrl));
    }

    // 6. Atomic upsert in database (SPEC §3)
    let userRecord;
    try {
      const result = await upsertGoogleUser(profile);
      userRecord = result.user;
    } catch (upsertErr: unknown) {
      const err = upsertErr as { code?: string; timeoutUntil?: Date };
      if (err?.code === "USER_BANNED") {
        return NextResponse.redirect(new URL("/login?error=banned", appUrl));
      }
      if (err?.code === "USER_TIMEOUT") {
        const untilParam = err.timeoutUntil
          ? `&until=${encodeURIComponent(err.timeoutUntil.toISOString())}`
          : "";
        return NextResponse.redirect(new URL(`/login?error=timeout_until${untilParam}`, appUrl));
      }
      throw upsertErr;
    }

    // 7. Create 30-day session and signed JWT
    const { token } = await createSession(userRecord);

    // 8. Set session cookie and redirect
    const targetUrl = new URL(returnTo, appUrl);
    const response = NextResponse.redirect(targetUrl);
    setSessionCookie(response, token);

    // Clear state cookie
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
  } catch (err: unknown) {
    console.error("Authentication error in callback:", err);
    const code = (err as { code?: string })?.code;
    if (code === "OAUTH_TIMEOUT") {
      return NextResponse.redirect(new URL("/login?error=timeout", appUrl));
    }
    return NextResponse.redirect(new URL("/login?error=server_error", appUrl));
  }
}
