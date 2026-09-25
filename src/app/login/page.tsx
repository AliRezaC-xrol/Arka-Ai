"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";

import { ArkaMark } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

const BRAND_POINTS = [
  {
    title: "همه‌ی مدل‌ها، یک گفتگو",
    text: "GPT، Claude، Gemini، Grok و DeepSeek — بدون جابه‌جایی بین سایت‌ها.",
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

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginCard() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);

  const error = searchParams.get("error");
  const returnTo = searchParams.get("returnTo") || "/chat";

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
        const until = searchParams.get("until");
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

  const handleGoogleLogin = () => {
    setIsLoading(true);
    const googleLoginUrl = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.href = googleLoginUrl;
  };

  return (
    <div className="w-full max-w-[26rem]">
      {/* Mobile brand row */}
      <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
        <ArkaMark className="size-6" />
        <span dir="ltr" className="font-display text-[18px] font-bold tracking-[-0.02em]">
          ARKA
        </span>
      </div>

      <div className="rounded-card border border-line bg-card p-6 sm:p-8">
        <div>
          <h1 className="text-[1.4rem] font-extrabold leading-snug">ورود یا ساخت حساب</h1>
          <p className="mt-2 text-[13.5px] leading-7 text-foreground-2">
            با یک کلیک و فقط از طریق حساب گوگل، وارد محیط جامع هوش مصنوعی شوید.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-control border border-red-500/30 bg-red-500/10 p-3.5 text-[13px] leading-6 text-red-300"
          >
            <p>{errorMessage}</p>
            {canRetry && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white underline underline-offset-4 hover:opacity-80"
              >
                <RotateCcw className="size-3.5" />
                تلاش دوباره
              </button>
            )}
          </div>
        )}

        {/* Google OAuth Action Button - The ONLY method */}
        <div className="mt-7 grid gap-3">
          <Button
            size="lg"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="group relative flex h-12 w-full items-center justify-center gap-3 border border-white/20 bg-white text-[14.5px] font-semibold text-black shadow-sm transition-all duration-200 hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin text-black" />
                <span>در حال انتقال به گوگل...</span>
              </>
            ) : (
              <>
                <GoogleGlyph />
                <span>ورود با حساب گوگل</span>
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 border-t border-line/60 pt-5 text-center">
          <p className="text-[12px] leading-6 text-foreground-3">
            ورود اول حساب جدید می‌سازد و ورودهای بعدی همان حساب قبلی را باز می‌کنند.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-center">
        <p className="text-[11.5px] leading-5 text-foreground-3">
          با ادامه، شرایط استفاده و حریم خصوصی Arka را می‌پذیرید.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Brand panel (desktop) */}
      <aside
        aria-label="درباره‌ی ارکا"
        className="relative hidden w-[44%] max-w-2xl flex-col justify-between overflow-hidden border-s border-line bg-[#0c0c0c] p-10 lg:flex xl:p-14"
      >
        <div aria-hidden className="mesh-dark pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(46rem_26rem_at_75%_-12%,rgba(255,255,255,0.08),transparent_70%)]"
        />

        <div className="relative flex items-center gap-2.5">
          <ArkaMark className="size-7" />
          <span dir="ltr" className="font-display text-[19px] font-bold tracking-[-0.02em]">
            ARKA
          </span>
        </div>

        <div className="relative">
          <h2 className="text-[2.4rem] font-extrabold leading-[1.28] xl:text-[2.9rem]">
            یک حساب،
            <br />
            همه‌ی مدل‌های
            <br />
            هوش مصنوعی.
          </h2>
          <ul className="mt-10 space-y-7">
            {BRAND_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04]"
                >
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
                <span>
                  <span className="block text-[15.5px] font-bold">{point.title}</span>
                  <span className="mt-1.5 block max-w-md text-[13.5px] leading-7 text-white/50">
                    {point.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12.5px] text-white/35">© ۲۰۲۶ ارکا — پلتفرم هوش مصنوعی</p>
      </aside>

      {/* Main form area */}
      <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(52rem_36rem_at_50%_38%,black,transparent_82%)]"
        />
        <div aria-hidden className="glow pointer-events-none absolute inset-0" />

        <Link
          href="/"
          className="absolute start-4 top-5 z-[1] inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-[13.5px] text-foreground-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:start-8"
        >
          <ArrowRight aria-hidden className="size-4" />
          بازگشت
        </Link>

        <React.Suspense
          fallback={
            <div className="flex h-64 w-full max-w-[26rem] items-center justify-center rounded-card border border-line bg-card p-6">
              <Loader2 className="size-6 animate-spin text-foreground-3" />
            </div>
          }
        >
          <LoginCard />
        </React.Suspense>
      </main>
    </div>
  );
}
