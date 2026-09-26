/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { ArkaMark } from "@/components/site-navbar";
import { GoogleLoginButton } from "@/components/google-login-button";
import { MeshCanvas } from "@/components/mesh-canvas";

const BRAND_POINTS = [
  {
    title: "همه‌ی مدل‌ها، یک گفتگو",
    text: "GPT، Claude، Gemini، Grok و DeepSeek — بدون جابه‌جایی میان چندین سایت و اشتراک.",
  },
  {
    title: "ورود آنی و امن فقط با گوگل",
    text: "بدون نیاز به به‌خاطرسپردن رمز عبور یا انتظار برای کدهای پیامکی و ایمیلی.",
  },
  {
    title: "حفظ حریم خصوصی و نشست پایدار",
    text: "سشن امن ۳۰ روزه با رمزنگاری پیشرفته؛ بدون خروج‌های ناگهانی.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; until?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const returnTo = params.returnTo || "/chat";

  let errorMessage: string | null = null;
  let canRetry = false;

  if (error) {
    canRetry = true;
    switch (error) {
      case "cancelled":
        errorMessage = "ورود با حساب گوگل لغو شد. برای ادامه می‌توانید دوباره تلاش کنید.";
        break;
      case "timeout":
        errorMessage = "ارتباط با سرویس گوگل با وقفه (Timeout) مواجه شد. لطفاً اتصال اینترنت خود را بررسی و دوباره تلاش کنید.";
        break;
      case "banned":
        errorMessage = "این حساب کاربری مسدود شده است. برای بررسی بیشتر با پشتیبانی تماس بگیرید.";
        canRetry = false;
        break;
      case "timeout_until":
        const until = params.until;
        const formattedUntil = until ? new Date(until).toLocaleString("fa-IR") : "مدتی دیگر";
        errorMessage = `دسترسی شما به سامانه تا ${formattedUntil} موقتاً محدود شده است.`;
        canRetry = false;
        break;
      case "oauth_config":
        errorMessage = "تنظیمات Google OAuth (Client ID / Secret) در فایل .env سرور تعریف نشده است. لطفاً اسکریپت تنظیم گوگل را در سرور اجرا کنید.";
        break;
      case "invalid_state":
        errorMessage = "خطای اعتبارسنجی امنیتی در ورود (CSRF). لطفاً دوباره امتحان کنید.";
        break;
      default:
        errorMessage = "خطایی در فرآیند احراز هویت رخ داد. لطفاً دوباره تلاش کنید.";
        break;
    }
  }

  return (
    <div className="relative flex min-h-dvh w-full bg-[#08080a] text-foreground overflow-hidden" dir="rtl">
      {/* 1. Uniform background mesh - no halos, no radial masks, no color mismatch */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20">
        <MeshCanvas spacing={64} />
      </div>

      {/* 2. Brand panel (desktop - right side in RTL). No divider line: the two
             halves sit side by side on the same background, both centred. */}
      <aside
        aria-label="درباره‌ی ارکا"
        className="relative z-10 hidden w-1/2 flex-col items-center justify-between p-10 text-center lg:flex xl:p-14"
      >
        {/* Top Brand Logo */}
        <div className="flex items-center gap-2.5">
          <ArkaMark className="size-7 text-white" />
          <span dir="ltr" className="font-display text-[19px] font-bold tracking-[-0.02em] text-white">
            ARKA
          </span>
        </div>

        {/* Center Content: horizontally centred */}
        <div className="my-auto w-full max-w-xl py-8">
          <h2 className="mx-auto text-[2.1rem] font-extrabold leading-[1.35] tracking-tight text-white lg:text-[2.5rem] xl:text-[2.8rem]">
            یک حساب برای همه‌ی مدل‌های هوش مصنوعی.
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-7 text-neutral-300">
            دسترسی متمرکز و بدون فیلتر به هوش مصنوعی‌های برتر جهان در یک محیط یکپارچه فارسی.
          </p>

          <ul className="mx-auto mt-8 max-w-lg space-y-6">
            {BRAND_POINTS.map((point) => (
              <li key={point.title} className="flex flex-col items-center gap-2.5 text-center">
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white"
                >
                  <Check className="size-3.5" strokeWidth={2.5} />
                </span>
                <div>
                  <span className="block text-[15px] font-bold text-white">{point.title}</span>
                  <span className="mt-1 block text-[13px] leading-6 text-neutral-400">{point.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom copyright */}
        <p className="text-[12.5px] text-neutral-500">© ۲۰۲۶ ارکا — پلتفرم هوش مصنوعی</p>
      </aside>

      {/* 3. Main login card area (left side in RTL) */}
      <main className="relative z-10 flex min-h-dvh flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[26rem]">
          {/* Mobile brand row */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <ArkaMark className="size-6 text-white" />
            <span dir="ltr" className="font-display text-[18px] font-bold tracking-[-0.02em] text-white">
              ARKA
            </span>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#101013]/95 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_16px_40px_rgba(0,0,0,0.7)] text-center">
            {/* Centered Brand Icon */}
            <div className="mx-auto mb-5 grid size-13 place-items-center rounded-2xl border border-white/15 bg-white/[0.05] shadow-inner">
              <ArkaMark className="size-6 text-white" />
            </div>

            {/* Centered Title and Subtitle */}
            <h1 className="text-[1.4rem] font-extrabold leading-snug text-white text-center">
              ورود یا ساخت حساب
            </h1>
            <p className="mt-2.5 text-[13px] leading-6 text-neutral-400 text-center mx-auto max-w-xs">
              با یک کلیک و فقط از طریق حساب گوگل، به سامانه متصل شوید.
            </p>

            {/* Error notification */}
            {errorMessage && (
              <div
                role="alert"
                className="mt-6 rounded-control border border-red-500/30 bg-red-500/10 p-3.5 text-[13px] leading-6 text-red-300 text-start"
              >
                <p>{errorMessage}</p>
                {canRetry && (
                  <Link
                    href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white underline underline-offset-4 hover:opacity-80"
                  >
                    تلاش دوباره با حساب گوگل
                  </Link>
                )}
              </div>
            )}

            {/* Google OAuth Action Button */}
            <div className="mt-7 grid gap-3">
              <GoogleLoginButton returnTo={returnTo} />
            </div>

            <div className="mt-6 border-t border-white/5 pt-5 text-center">
              <p className="text-[11.5px] leading-6 text-neutral-500">
                ورود اول حساب جدید می‌سازد و ورودهای بعدی همان حساب قبلی را باز می‌کنند.
              </p>
            </div>
          </div>

          {/* Centered Back button placed below the login box */}
          <div className="mt-6 flex flex-col items-center gap-3.5 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-neutral-300 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowRight aria-hidden className="size-4" />
              <span>بازگشت به صفحه‌ی اصلی</span>
            </Link>

            <p className="text-[11px] leading-5 text-neutral-500">
              با ورود به ارکا، قوانین استفاده و حریم خصوصی را می‌پذیرید.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
