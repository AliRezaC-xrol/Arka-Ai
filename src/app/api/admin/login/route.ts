/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminRateLimit,
  createAdminSession,
  getAdminPassword,
  recordFailedAdminAttempt,
  resetAdminRateLimit,
  setAdminCookie,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  // Use client IP or fallback
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "client-default";

  // 1. Check Rate Limit
  const rateLimit = checkAdminRateLimit(ip);
  if (rateLimit.isLocked) {
    return NextResponse.json(
      {
        error: `به دلیل ۵ بار تلاش ناموفق، دسترسی برای ${rateLimit.remainingMinutes} دقیقه قفل شده است.`,
        locked: true,
        remainingMinutes: rateLimit.remainingMinutes,
      },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = (body.password || "").trim();

  const correctPassword = getAdminPassword();

  // 2. Validate Password
  if (!password || password !== correctPassword) {
    const attemptRecord = recordFailedAdminAttempt(ip);

    if (attemptRecord.isLocked) {
      return NextResponse.json(
        {
          error: "به دلیل ۵ بار تلاش ناموفق متوالی، دسترسی برای ۱۰ دقیقه قفل شد.",
          locked: true,
          remainingMinutes: 10,
        },
        { status: 429 },
      );
    }

    const remainingAttempts = 5 - attemptRecord.attempts;
    return NextResponse.json(
      {
        error: `رمز عبور مدیریت نادرست است. (${remainingAttempts} تلاش باقی‌مانده)`,
        remainingAttempts,
      },
      { status: 401 },
    );
  }

  // 3. Password correct: Reset rate limit & Issue session
  resetAdminRateLimit(ip);

  const token = await createAdminSession();
  const response = NextResponse.json({ success: true, token });
  setAdminCookie(response, token);

  return response;
}
