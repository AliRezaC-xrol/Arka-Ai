"use client";

import * as React from "react";
import Link from "next/link";

import { OtpInput } from "@/components/otp-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "choice" | "email" | "code";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient background (SPEC §7.1): drifting dot grid + soft light gradient */}
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="glow pointer-events-none absolute inset-0" />

      <main className="w-full max-w-sm">
        <div key={step} className="step-in rounded-card border border-line bg-card p-6 sm:p-7">
          <div className="text-center">
            <Link
              href="/"
              className="inline-block text-lg font-semibold tracking-tight text-foreground"
            >
              Arka
            </Link>
            <p className="mt-1.5 text-[13px] text-foreground-2">
              {step === "code" ? "کد تأیید" : "ورود یا ساخت حساب"}
            </p>
          </div>

          {step === "choice" && (
            <div className="mt-7 grid gap-3">
              <Button
                onClick={() =>
                  setNote("ورود با گوگل در فاز ۱ متصل می‌شود — این نسخه نمایشی است.")
                }
              >
                ادامه با گوگل
              </Button>
              <Button variant="outline" onClick={() => setStep("email")}>
                ادامه با ایمیل
              </Button>
            </div>
          )}

          {step === "email" && (
            <form
              className="mt-6 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (emailValid) goToCode();
              }}
            >
              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-[13px] text-foreground-2">
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
                  className="text-left"
                  required
                />
              </div>
              <Button type="submit" disabled={!emailValid}>
                ارسال کد
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("choice");
                  setNote(null);
                }}
                className="text-xs text-foreground-3 transition-colors hover:text-foreground-2"
              >
                بازگشت
              </button>
            </form>
          )}

          {step === "code" && (
            <div className="mt-6 grid gap-4">
              <p className="text-[13px] leading-6 text-foreground-2">
                کد ۶ رقمی ارسال‌شده به{" "}
                <span dir="ltr" className="text-foreground">
                  {email}
                </span>{" "}
                را وارد کن.
              </p>
              <OtpInput onComplete={(value) => setCode(value)} />
              <Button
                disabled={code.length !== 6}
                onClick={() =>
                  setNote("کد دریافت شد — تأیید واقعی در فاز ۱ انجام می‌شود.")
                }
              >
                تأیید و ورود
              </Button>
              <div className="flex items-center justify-between text-xs">
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
                <p className="text-center text-[11px] leading-5 text-foreground-3">
                  نسخه‌ی نمایشی: هر ۶ رقمی را وارد کن؛ ایمیلی ارسال نمی‌شود.
                </p>
              )}
            </div>
          )}

          {note && (
            <p
              role="status"
              className="mt-5 rounded-control border border-line bg-elevated px-3.5 py-2.5 text-center text-xs leading-6 text-foreground-2"
            >
              {note}
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-foreground-3">
          با ادامه، شرایط استفاده از Arka را می‌پذیری.
        </p>
      </main>
    </div>
  );
}
