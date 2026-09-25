"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { OtpInput } from "@/components/otp-input";
import { ArkaMark } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Step = "choice" | "email" | "code";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const STEPS: Step[] = ["choice", "email", "code"];

const BRAND_POINTS = [
  {
    title: "همه‌ی مدل‌ها، یک گفتگو",
    text: "GPT، Claude، Gemini، Grok و DeepSeek — بدون جابه‌جایی بین سایت‌ها.",
  },
  {
    title: "کلید خودت یا پروایدر آماده",
    text: "یا فقط کلید API خودت را وصل کن؛ ارکا بقیه‌ی کار را انجام می‌دهد.",
  },
  {
    title: "خصوصی و رمزنگاری‌شده",
    text: "کلیدها با AES-256-GCM رمز می‌شوند و گفتگوها فقط برای خودت قابل دیدن‌اند.",
  },
];

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]">
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.68-.06-1.36-.19-2.02H12v3.83h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.74 2.97-4.3 2.97-7.33Z"
      />
      <path
        fill="currentColor"
        opacity="0.75"
        d="M12 21.99c2.7 0 4.96-.9 6.62-2.42l-3.23-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="currentColor"
        opacity="0.5"
        d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.06a10 10 0 0 0 0 8.96l3.34-2.58Z"
      />
      <path
        fill="currentColor"
        opacity="0.85"
        d="M12 5.97c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.97 9.97 0 0 0 3.06 7.51L6.4 10.1c.8-2.36 3-4.13 5.6-4.13Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [step, setStep] = React.useState<Step>("choice");
  const [email, setEmail] = React.useState("");
  const [note, setNote] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [codeSent, setCodeSent] = React.useState(false);

  const emailValid = EMAIL_PATTERN.test(email);

  const goToCode = () => {
    setNote(null);
    setCode("");
    setCodeSent(true);
    setStep("code");
  };

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* ================= Brand panel (lg+) ================= */}
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
          <span dir="ltr" className="font-display text-[19px] font-bold tracking-[-0.02em]">ARKA</span>
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

        <p className="relative text-[12.5px] text-white/35">© ۲۰۲۶ ارکا — محیط آزمایشی</p>
      </aside>

      {/* ================= Form side ================= */}
      <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(52rem_36rem_at_50%_38%,black,transparent_82%)]" />
        <div aria-hidden className="glow pointer-events-none absolute inset-0" />

        <Link
          href="/"
          className="absolute start-4 top-5 z-[1] inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-[13.5px] text-foreground-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:start-8"
        >
          <ArrowRight aria-hidden className="size-4" />
          بازگشت
        </Link>

        <div className="relative w-full max-w-[26rem]">
          {/* Mobile brand row (the aside is hidden below lg) */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <ArkaMark className="size-6" />
            <span dir="ltr" className="font-display text-[18px] font-bold tracking-[-0.02em]">ARKA</span>
          </div>

          {/* Step indicator */}
          <div className="mb-4 flex items-center justify-center gap-1.5" aria-hidden>
            {STEPS.map((s) => (
              <span
                key={s}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  s === step ? "w-6 bg-white" : "w-1.5 bg-white/20",
                )}
              />
            ))}
          </div>

          <div key={step} className="step-in rounded-card border border-line bg-card p-6 sm:p-8">
            {step === "choice" && (
              <div>
                <h1 className="text-[1.4rem] font-extrabold leading-snug">ورود یا ساخت حساب</h1>
                <p className="mt-2 text-[13.5px] leading-7 text-foreground-2">
                  با یک حساب، همه‌ی مدل‌ها را در یک محیط فارسی داشته باش.
                </p>
                <div className="mt-7 grid gap-3">
                  <Button size="lg" onClick={() => setNote("ورود با گوگل در فاز ۱ متصل می‌شود — این نسخه نمایشی است.")}>
                    <GoogleGlyph />
                    ادامه با گوگل
                  </Button>
                  <div className="flex items-center gap-3 text-[12px] text-foreground-3" aria-hidden>
                    <span className="h-px flex-1 bg-line" />
                    یا
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <Button size="lg" variant="outline" onClick={() => setStep("email")}>
                    ادامه با ایمیل
                  </Button>
                </div>
                <p className="mt-6 text-center text-[12px] leading-6 text-foreground-3">
                  بعد از ثبت‌نام، ۱۰۰ پیام رایگان داری.
                </p>
              </div>
            )}

            {step === "email" && (
              <form
                className="grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (emailValid) goToCode();
                }}
              >
                <div>
                  <h1 className="text-[1.4rem] font-extrabold leading-snug">ایمیلت را وارد کن</h1>
                  <p className="mt-2 text-[13.5px] leading-7 text-foreground-2">
                    یک کد ۶ رقمی برایت می‌فرستیم؛ بدون رمز عبور.
                  </p>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-[13px] font-medium text-foreground-2">
                    ایمیل
                  </label>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="h-11 text-left"
                    required
                  />
                </div>
                <Button type="submit" size="lg" disabled={!emailValid}>
                  ارسال کد
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("choice");
                    setNote(null);
                  }}
                  className="text-[13px] text-foreground-3 transition-colors hover:text-foreground-2"
                >
                  بازگشت به روش‌های ورود
                </button>
              </form>
            )}

            {step === "code" && (
              <div className="grid gap-5">
                <div>
                  <h1 className="text-[1.4rem] font-extrabold leading-snug">کد تأیید</h1>
                  <p className="mt-2 text-[13.5px] leading-7 text-foreground-2">
                    کد ۶ رقمی ارسال‌شده به{" "}
                    <span dir="ltr" className="font-medium text-foreground">
                      {email}
                    </span>{" "}
                    را وارد کن.
                  </p>
                </div>
                <OtpInput onComplete={(value) => setCode(value)} />
                <Button
                  size="lg"
                  disabled={code.length !== 6}
                  onClick={() => setNote("کد دریافت شد — تأیید واقعی در فاز ۱ انجام می‌شود.")}
                >
                  تأیید و ورود
                </Button>
                <div className="flex items-center justify-between text-[13px]">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-foreground-3 transition-colors hover:text-foreground-2"
                  >
                    تغییر ایمیل
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote("در نسخه‌ی نمایشی، ارسال مجدد کد شبیه‌سازی می‌شود.")}
                    className="text-foreground-3 transition-colors hover:text-foreground-2"
                  >
                    ارسال مجدد کد
                  </button>
                </div>
                {codeSent && (
                  <p className="text-center text-[11.5px] leading-6 text-foreground-3">
                    نسخه‌ی نمایشی: هر ۶ رقمی را وارد کن؛ ایمیلی ارسال نمی‌شود.
                  </p>
                )}
              </div>
            )}

            {note && (
              <p
                role="status"
                className="mt-6 rounded-control border border-line bg-elevated px-3.5 py-2.5 text-center text-xs leading-6 text-foreground-2"
              >
                {note}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-2 text-center">
            <p className="text-[11.5px] leading-5 text-foreground-3">
              با ادامه، شرایط استفاده از Arka را می‌پذیری.
            </p>
            <Link
              href="/chat"
              className="inline-block rounded-sm text-[12.5px] text-foreground-3 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              فقط می‌خواهم محیط چت را ببینم
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
