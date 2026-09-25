import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  getCurrentUser,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const payload = await verifySessionToken(token);
  if (!payload?.sub) {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    clearSessionCookie(response);
    return response;
  }

  const user = await getCurrentUser();
  if (!user) {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  });
}
