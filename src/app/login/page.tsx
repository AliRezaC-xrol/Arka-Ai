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
    <div className="flex min-h-dvh bg-background text-foreground" dir="rtl">
      {/* Brand panel (desktop) */}
      <aside
        aria-label="درباره‌ی ارکا"
        className="relative hidden w-[45%] max-w-2xl flex-col justify-between overflow-hidden border-s border-line bg-[#0a0a0c] p-10 lg:flex xl:p-14"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
          <MeshCanvas spacing={64} />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_80%)]"
        />

        <div className="relative flex items-center gap-2.5">
          <ArkaMark className="size-7 text-white" />
          <span dir="ltr" className="font-display text-[19px] font-bold tracking-[-0.02em] text-white">
            ARKA
          </span>
        </div>

        <div className="relative">
          <h2 className="text-[2.4rem] font-extrabold leading-[1.28] xl:text-[2.9rem] text-white">
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
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white"
                >
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
                <span>
                  <span className="block text-[15.5px] font-bold text-white">{point.title}</span>
                  <span className="mt-1.5 block max-w-md text-[13.5px] leading-7 text-neutral-400">
                    {point.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12.5px] text-neutral-500">© ۲۰۲۶ ارکا — پلتفرم هوش مصنوعی</p>
      </aside>

      {/* Main login card area */}
      <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-8 bg-[#070709]">
        {/* Animated sleeping mesh in background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_80%)] opacity-35"
        >
          <MeshCanvas spacing={60} />
        </div>

        <Link
          href="/"
          className="absolute start-4 top-5 z-[1] inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-[13px] text-neutral-400 transition-colors hover:text-white focus-visible:outline-none sm:start-8"
        >
          <ArrowRight aria-hidden className="size-4" />
          بازگشت به خانه
        </Link>

        <div className="relative z-10 w-full max-w-[26rem]">
          {/* Mobile brand row */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <ArkaMark className="size-6 text-white" />
            <span dir="ltr" className="font-display text-[18px] font-bold tracking-[-0.02em] text-white">
              ARKA
            </span>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#101013]/95 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_24px_50px_rgba(0,0,0,0.8)] text-center">
            {/* Centered Brand Icon */}
            <div className="mx-auto mb-5 grid size-13 place-items-center rounded-2xl border border-white/15 bg-white/[0.05] shadow-inner">
              <ArkaMark className="size-6 text-white" />
            </div>

            {/* Centered Title and Subtitle as explicitly requested */}
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

            {/* Google OAuth Action Button - The ONLY method */}
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
