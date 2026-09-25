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
        errorMessage = "تنظیمات Google OAuth (Client ID / Secret) در فایل .env تعریف نشده است.";
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
      {/* 1. Subtle, single uniform background grid without any clashing halos or seam lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_50%,transparent_95%)] opacity-25"
      >
        <MeshCanvas spacing={60} />
      </div>

      {/* 2. Brand panel (desktop - right side in RTL) with clean hairline divider border-e */}
      <aside
        aria-label="درباره‌ی ارکا"
        className="relative z-10 hidden w-[48%] max-w-2xl flex-col justify-between border-e border-white/10 bg-[#08080a]/40 p-10 lg:flex xl:p-14"
      >
        {/* Top Brand Logo */}
        <div className="flex items-center gap-2.5">
          <ArkaMark className="size-7 text-white" />
          <span dir="ltr" className="font-display text-[19px] font-bold tracking-[-0.02em] text-white">
            ARKA
          </span>
        </div>

        {/* Center Content: Balanced headline with NO empty space in front of text */}
        <div className="my-auto py-8">
          <h2 className="text-[2.2rem] lg:text-[2.6rem] xl:text-[2.9rem] font-extrabold leading-[1.35] tracking-tight text-white">
            یک حساب برای همه‌ی
            <br />
            مدل‌های هوش مصنوعی.
          </h2>

          <p className="mt-4 text-[14.5px] leading-7 text-neutral-300 max-w-lg">
            دسترسی متمرکز و بدون فیلتر به هوش مصنوعی‌های برتر جهان در یک محیط یکپارچه فارسی.
          </p>

          <ul className="mt-8 space-y-6">
            {BRAND_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-3.5">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white"
                >
                  <Check className="size-3.5" strokeWidth={2.5} />
                </span>
                <div>
                  <span className="block text-[15px] font-bold text-white">{point.title}</span>
                  <span className="mt-1 block max-w-md text-[13px] leading-6 text-neutral-400">
                    {point.text}
                  </span>
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
        <Link
          href="/"
          className="absolute start-4 top-5 z-[1] inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-[13px] text-neutral-400 transition-colors hover:text-white focus-visible:outline-none sm:start-8"
        >
          <ArrowRight aria-hidden className="size-4" />
          بازگشت به خانه
        </Link>

        <div className="w-full max-w-[26rem]">
          {/* Mobile brand row */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <ArkaMark className="size-6 text-white" />
            <span dir="ltr" className="font-display text-[18px] font-bold tracking-[-0.02em] text-white">
              ARKA
            </span>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#101013]/95 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_24px_50px_rgba(0,0,0,0.85)] text-center">
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

          <div className="mt-5 space-y-2 text-center">
            <p className="text-[11px] leading-5 text-neutral-500">
              با ورود به ارکا، قوانین استفاده و حریم خصوصی را می‌پذیرید.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
