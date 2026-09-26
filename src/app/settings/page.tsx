"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Settings → account.
 *
 * This page used to be a bare `redirect("/settings/providers")`, which meant
 * the "تنظیمات حساب" entry in the user menu just bounced you to the API-key
 * screen. It is now a real account page that shows the signed-in identity and
 * links out to the one place keys are managed.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Info,
  KeyRound,
  LogOut,
  MessageSquarePlus,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { UserMenu } from "@/components/user-menu";
import { getStoredAdminToken } from "@/lib/admin-fetch";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

function Row({
  label,
  value,
  dir,
}: {
  label: string;
  value: React.ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-b-0">
      <span className="shrink-0 text-[12.5px] text-neutral-400">{label}</span>
      <span
        dir={dir}
        className="min-w-0 truncate text-[13px] font-medium text-foreground"
      >
        {value}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasAdminToken, setHasAdminToken] = React.useState(false);

  React.useEffect(() => {
    /* sessionStorage/localStorage are not available during SSR, so this
       has to be read in an effect, not during render. */
    setHasAdminToken(Boolean(getStoredAdminToken()));

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[#070709] text-foreground" dir="rtl">
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="inline-flex shrink-0 items-center gap-2 rounded-control px-2.5 py-2 text-[13px] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white sm:px-3"
        >
          <ArrowRight aria-hidden className="size-4" />
          <span className="hidden sm:inline">بازگشت به چت</span>
          <span className="sm:hidden">چت</span>
        </button>

        <div className="min-w-0 shrink">
          <UserMenu
            name={user?.name || "کاربر ارکا"}
            subtitle={user?.email || "حساب گوگل"}
            avatarUrl={user?.avatarUrl}
            placement="down"
            compact
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        <h1 className="text-[1.35rem] font-extrabold tracking-tight text-white">
          حساب کاربری و تنظیمات
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-neutral-400">
          اطلاعات حساب شما و میان‌برهای تنظیمات ارکا.
        </p>

        {/* Identity */}
        <section className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-[#111114] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-white">
            <UserRound aria-hidden className="size-4 text-neutral-400" />
            <span>اطلاعات حساب</span>
          </div>

          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-sm font-semibold text-neutral-300">
              {user?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatarUrl}
                  alt={user?.name || "کاربر"}
                  className="size-full object-cover"
                />
              ) : (
                (user?.name || user?.email || "ک").trim().charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-white">
                {loading ? "در حال بارگذاری…" : user?.name || "کاربر ارکا"}
              </p>
              <p dir="ltr" className="truncate text-start text-[12px] text-neutral-400">
                {loading ? "" : user?.email || "بدون ایمیل"}
              </p>
            </div>
          </div>

          <div className="mt-1">
            <Row
              label="وضعیت"
              value={
                loading ? (
                  "…"
                ) : user ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <Check aria-hidden className="size-3.5" />
                    <span>فعال</span>
                  </span>
                ) : (
                  "مهمان"
                )
              }
            />
            <Row label="نوع ورود" value="حساب گوگل" />
          </div>
        </section>

        {/* Shortcuts */}
        <section className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-[#111114] p-2">
          <Link
            href="/settings/providers"
            className="press flex items-center gap-3 rounded-[16px] px-3 py-3 text-[13px] text-neutral-200 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <KeyRound aria-hidden className="size-4 shrink-0 text-amber-400" />
            <span className="flex-1">کلیدهای API من</span>
            <span className="text-[11px] text-neutral-500">
              اتصال مدل‌های شخصی
            </span>
          </Link>

          <Link
            href="/chat"
            className="press flex items-center gap-3 rounded-[16px] px-3 py-3 text-[13px] text-neutral-200 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <MessageSquarePlus aria-hidden className="size-4 shrink-0 text-sky-400" />
            <span className="flex-1">گفتگوی جدید</span>
            <span className="text-[11px] text-neutral-500">شروع گفتگو</span>
          </Link>

          {/* The admin panel lives on an obfuscated route, so it is otherwise
              unreachable. Only surface the link once this browser actually
              holds an admin token — no point advertising it to everyone. */}
          {hasAdminToken && (
            <Link
              href="/c-xroladi1n"
              className="press flex items-center gap-3 rounded-[16px] px-3 py-3 text-[13px] text-neutral-200 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <ShieldCheck aria-hidden className="size-4 shrink-0 text-emerald-400" />
              <span className="flex-1">پنل مدیریت سیستم</span>
              <span className="text-[11px] text-neutral-500">مدیر</span>
            </Link>
          )}
        </section>

        {/* Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-3.5">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-neutral-500" />
          <p className="text-[12px] leading-5 text-neutral-400">
            برای تغییر نام یا تصویر پروفایل، آن را از حساب گوگل خود به‌روزرسانی کنید؛ ارکا
            همان اطلاعات را نمایش می‌دهد.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/auth/logout";
          }}
          className="press mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-[13px] font-semibold text-red-300 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.12]"
        >
          <LogOut aria-hidden className="size-4" />
          <span>خروج از حساب</span>
        </button>
      </main>
    </div>
  );
}
