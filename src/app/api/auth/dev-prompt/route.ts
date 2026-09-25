/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeReturnTo } from "@/lib/google-oauth";

/**
 * Dev-only simulated Google OAuth screen when GOOGLE_CLIENT_ID is not configured.
 * Matches standard Google consent UI aesthetics to test all flows (success, cancel, errors).
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_AUTH !== "true") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Accounts — Sign in</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0d0d0d;
      color: #fff;
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      background: #141414;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      text-align: center;
    }
    .google-logo {
      width: 48px;
      height: 48px;
      margin: 0 auto 18px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    p {
      color: rgba(255,255,255,0.65);
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .banner {
      background: rgba(255,255,255,0.04);
      border: 1px dashed rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11.5px;
      color: rgba(255,255,255,0.7);
      margin-bottom: 20px;
      text-align: right;
      line-height: 1.6;
    }
    .accounts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .account-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
      text-decoration: none;
      color: #fff;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .account-item:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.2);
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #252525;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      color: #fff;
    }
    .info {
      text-align: right;
      flex: 1;
    }
    .name { font-size: 13.5px; font-weight: 600; }
    .email { font-size: 11.5px; color: rgba(255,255,255,0.5); }
    .custom-form {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 16px;
      margin-top: 12px;
      text-align: right;
    }
    .input-field {
      width: 100%;
      padding: 10px 12px;
      background: #0a0a0a;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      color: #fff;
      font-size: 13px;
      margin-bottom: 10px;
      direction: ltr;
      text-align: left;
    }
    .btn-submit {
      width: 100%;
      padding: 10px;
      background: #fff;
      color: #000;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-submit:hover { background: #e5e5e5; }
    .btn-cancel {
      display: inline-block;
      margin-top: 16px;
      color: rgba(255,255,255,0.45);
      font-size: 12.5px;
      text-decoration: none;
    }
    .btn-cancel:hover { color: #fff; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <svg class="google-logo" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
    <h1>انتخاب حساب گوگل</h1>
    <p>برای ورود به ارکا، یک حساب گوگل انتخاب کنید یا حساب جدید وارد نمایید.</p>

    <div class="banner">
      💡 حالت شبیه‌ساز ورود در محیط محلی (Google Consent Simulator). برای استفاده از کلیدهای واقعی گوگل، مقادیر <code>GOOGLE_CLIENT_ID</code> و <code>GOOGLE_CLIENT_SECRET</code> را در <code>.env</code> قرار دهید.
    </div>

    <div class="accounts-list">
      <a class="account-item" href="/api/auth/mock-login?email=user.arka@gmail.com&name=کاربر ارکا&googleId=google_user_001&returnTo=${encodeURIComponent(returnTo)}">
        <div class="avatar">ع</div>
        <div class="info">
          <div class="name">کاربر ارکا (تست ۱)</div>
          <div class="email">user.arka@gmail.com</div>
        </div>
      </a>

      <a class="account-item" href="/api/auth/mock-login?email=alireza.cxrol@gmail.com&name=Ali Reza&googleId=google_user_002&returnTo=${encodeURIComponent(returnTo)}">
        <div class="avatar">A</div>
        <div class="info">
          <div class="name">Ali Reza (تست ۲)</div>
          <div class="email">alireza.cxrol@gmail.com</div>
        </div>
      </a>
    </div>

    <form class="custom-form" action="/api/auth/mock-login" method="GET">
      <input type="hidden" name="returnTo" value="${encodeURIComponent(returnTo)}" />
      <div style="font-size:12px; margin-bottom:8px; color:rgba(255,255,255,0.7);">یا ورود با ایمیل گوگل دلخواه:</div>
      <input class="input-field" type="email" name="email" placeholder="new.account@gmail.com" required />
      <input class="input-field" type="text" name="name" placeholder="نام نمایشی" style="direction:rtl; text-align:right;" />
      <button class="btn-submit" type="submit">ورود به عنوان این کاربر</button>
    </form>

    <div>
      <a class="btn-cancel" href="/login?error=cancelled">انصراف و لغو ورود (Cancel)</a>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
