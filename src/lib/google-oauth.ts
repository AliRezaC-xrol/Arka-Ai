/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export const OAUTH_STATE_COOKIE_NAME = "arka_oauth_state";

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  const isConfigured = Boolean(clientId.trim() && clientSecret.trim());

  return {
    clientId,
    clientSecret,
    appUrl,
    redirectUri: `${appUrl}/api/auth/callback/google`,
    isConfigured,
  };
}

export interface OAuthStateData {
  token: string;
  returnTo: string;
}

/**
 * Builds standard Google OAuth 2.0 authorization URL
 */
export function buildGoogleAuthUrl(stateString: string) {
  const { clientId, redirectUri } = getGoogleConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: stateString,
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges authorization code with Google token endpoint
 */
export async function exchangeGoogleCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Google token exchange error:", res.status, errBody);
      throw new Error(`Google token exchange failed: ${res.status}`);
    }

    const data = await res.json();
    return data as {
      access_token: string;
      id_token?: string;
      token_type: string;
      expires_in: number;
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      const timeoutErr = new Error("OAUTH_TIMEOUT");
      (timeoutErr as unknown as { code: string }).code = "OAUTH_TIMEOUT";
      throw timeoutErr;
    }
    throw err;
  }
}

/**
 * Fetches user profile using access token
 */
export async function fetchGoogleUserProfile(accessToken: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to fetch Google userinfo: ${res.status}`);
    }

    const data = await res.json();
    return {
      googleId: data.sub as string,
      email: data.email as string,
      name: (data.name || data.given_name || null) as string | null,
      avatarUrl: (data.picture || null) as string | null,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      const timeoutErr = new Error("OAUTH_TIMEOUT");
      (timeoutErr as unknown as { code: string }).code = "OAUTH_TIMEOUT";
      throw timeoutErr;
    }
    throw err;
  }
}

/**
 * Validates returnTo path to prevent open redirect vulnerabilities
 */
export function sanitizeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo) return "/chat";
  if (!returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.startsWith("/\\")) {
    return "/chat";
  }
  return returnTo;
}
