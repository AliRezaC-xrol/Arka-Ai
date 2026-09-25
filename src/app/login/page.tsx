import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { ArkaMark } from "@/components/site-navbar";
import { GoogleLoginButton } from "@/components/google-login-button";

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

      {/* Main login card area */}
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
          بازگشت به خانه
        </Link>

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
                  <Link
                    href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white underline underline-offset-4 hover:opacity-80"
                  >
                    تلاش دوباره با حساب گوگل
                  </Link>
                )}
              </div>
            )}

            {/* Google OAuth Action Button - The ONLY method */}
            <div className="mt-7 grid gap-3">
              <GoogleLoginButton returnTo={returnTo} />
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
      </main>
    </div>
  );
}
