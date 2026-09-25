import { jwtVerify, SignJWT } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "arka_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60; // refresh if token is older than 7 days

// Protected path prefixes (AI environment, chat, settings, and private user APIs)
const PROTECTED_PREFIXES = [
  "/chat",
  "/settings",
  "/dashboard",
  "/api/chat",
  "/api/conversations",
  "/api/user-providers",
  "/api/notifications",
];

const ADMIN_COOKIE_NAME = "arka_admin_session";

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "arka-default-fallback-session-secret-key-32chars";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secret = getSessionSecret();

  // Admin route & API protection: Return 404 to avoid route disclosure
  if (
    (pathname.startsWith("/api/admin/") && pathname !== "/api/admin/login") ||
    pathname.startsWith("/c-xroladi1n/")
  ) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!adminToken) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const isLoginPage = pathname === "/login";

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let sessionPayload: Record<string, unknown> | null = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, secret);
      sessionPayload = payload;
    } catch {
      // Invalid or expired token
      sessionPayload = null;
    }
  }

  // 1. Protected routes guard
  if (isProtected) {
    if (!sessionPayload) {
      // Unauthenticated user -> redirect to /login with returnTo query
      const returnTo = pathname + (search || "");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", returnTo);

      const response = NextResponse.redirect(loginUrl);
      // Clean up any stale/corrupt cookie
      if (sessionCookie) {
        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: "",
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      }
      return response;
    }
  }

  // 2. If logged in user navigates to /login, redirect to /chat or returnTo
  if (isLoginPage && sessionPayload) {
    const returnTo = request.nextUrl.searchParams.get("returnTo");
    const target = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/chat";
    return NextResponse.redirect(new URL(target, request.url));
  }

  const response = NextResponse.next();

  // 3. Rolling session refresh: If authenticated and token is older than threshold, refresh cookie
  if (sessionPayload && sessionPayload.iat) {
    const issuedAt = Number(sessionPayload.iat);
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (nowInSeconds - issuedAt > REFRESH_THRESHOLD_SECONDS) {
      try {
        const refreshedToken = await new SignJWT({
          ...sessionPayload,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("30d")
          .sign(secret);

        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: refreshedToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE_SECONDS,
        });
      } catch (err) {
        console.warn("Failed to refresh session token in middleware:", err);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, robots.txt, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
