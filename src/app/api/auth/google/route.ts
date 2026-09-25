import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  getGoogleConfig,
  OAUTH_STATE_COOKIE_NAME,
  sanitizeReturnTo,
} from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const { isConfigured, appUrl } = getGoogleConfig();

  // If Google credentials are not set, provide dev simulation or error redirect
  if (!isConfigured) {
    if (process.env.NODE_ENV !== "production") {
      const devUrl = new URL("/api/auth/dev-prompt", appUrl);
      devUrl.searchParams.set("returnTo", returnTo);
      return NextResponse.redirect(devUrl);
    }
    return NextResponse.redirect(new URL("/login?error=oauth_config", appUrl));
  }

  const stateToken = crypto.randomUUID();
  const statePayload = Buffer.from(
    JSON.stringify({ token: stateToken, returnTo }),
  ).toString("base64url");

  const googleUrl = buildGoogleAuthUrl(statePayload);
  const response = NextResponse.redirect(googleUrl);

  // Store state in a short-lived httpOnly cookie to prevent CSRF
  response.cookies.set({
    name: OAUTH_STATE_COOKIE_NAME,
    value: statePayload,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
