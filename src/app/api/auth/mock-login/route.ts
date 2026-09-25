import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie, upsertGoogleUser } from "@/lib/auth";
import { getGoogleConfig, sanitizeReturnTo } from "@/lib/google-oauth";

/**
 * Dev/testing login route that executes the exact atomic upsert, session generation,
 * and cookie creation pipeline.
 */
export async function GET(request: NextRequest) {
  // Production security: completely disabled unless explicit test flag ALLOW_DEV_AUTH is true
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_AUTH !== "true") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { appUrl } = getGoogleConfig();

  const { searchParams } = new URL(request.url);

  const email = searchParams.get("email");
  const name = searchParams.get("name") || "کاربر تستی";
  const rawGoogleId = searchParams.get("googleId");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const shouldCancel = searchParams.get("cancel") === "true";
  const shouldTimeout = searchParams.get("timeout") === "true";

  if (shouldCancel) {
    return NextResponse.redirect(new URL("/login?error=cancelled", appUrl));
  }

  if (shouldTimeout) {
    return NextResponse.redirect(new URL("/login?error=timeout", appUrl));
  }

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=missing_profile", appUrl));
  }

  const googleId = rawGoogleId || `google_${Buffer.from(email).toString("hex").slice(0, 16)}`;

  try {
    const result = await upsertGoogleUser({
      email,
      googleId,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    });

    const { token } = await createSession(result.user);

    const targetUrl = new URL(returnTo, appUrl);
    const response = NextResponse.redirect(targetUrl);
    setSessionCookie(response, token);

    return response;
  } catch (err: unknown) {
    const errObj = err as { code?: string; timeoutUntil?: Date };
    if (errObj?.code === "USER_BANNED") {
      return NextResponse.redirect(new URL("/login?error=banned", appUrl));
    }
    if (errObj?.code === "USER_TIMEOUT") {
      const untilParam = errObj.timeoutUntil
        ? `&until=${encodeURIComponent(errObj.timeoutUntil.toISOString())}`
        : "";
      return NextResponse.redirect(new URL(`/login?error=timeout_until${untilParam}`, appUrl));
    }
    return NextResponse.redirect(new URL("/login?error=server_error", appUrl));
  }
}
