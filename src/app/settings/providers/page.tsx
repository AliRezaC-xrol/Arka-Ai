"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Settings → API keys.
 *
 * This page used to carry a second, independent implementation of the BYOK
 * form. It is now a thin shell around the single ByokManager component
 * (rendered inline instead of as a modal), so personal keys are managed in
 * exactly one place.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Settings } from "lucide-react";

import { ByokManager, type UserProviderRow } from "@/components/byok-manager";
import { UserMenu } from "@/components/user-menu";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export default function ProvidersSettingsPage() {
  const router = useRouter();
  const [providers, setProviders] = React.useState<UserProviderRow[]>([]);
  const [user, setUser] = React.useState<SessionUser | null>(null);

  const load = React.useCallback(() => {
    fetch("/api/user-providers")
      .then((res) => res.json())
      .then((data) => setProviders(data.providers || []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    load();

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setUser(data?.user ?? data ?? null))
      .catch(() => {});
  }, [load]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#070709] text-foreground" dir="rtl">
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="inline-flex shrink-0 items-center gap-2 rounded-control px-2.5 py-2 text-[13px] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white sm:px-3"
          >
            <ArrowRight aria-hidden className="size-4" />
            <span className="hidden sm:inline">بازگشت به چت</span>
            <span className="sm:hidden">چت</span>
          </button>

          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-control px-2.5 py-2 text-[13px] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white sm:px-3"
          >
            <Settings aria-hidden className="size-4" />
            <span className="hidden sm:inline">تنظیمات حساب</span>
            <span className="sm:hidden">حساب</span>
          </Link>
        </div>

        {/* Fixed-width avatar block used to overflow a 360px phone header. */}
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
        <h1 className="text-[1.35rem] font-extrabold tracking-tight text-white">کلیدهای API من</h1>
        <p className="mt-2 text-[13px] leading-6 text-neutral-400">
          کلید خودتان را وصل کنید تا مدل‌های آن پروایدر در فهرست مدل‌های چت ظاهر شوند. اتصال پیش از
          ذخیره به‌صورت واقعی با سرویس‌دهنده بررسی و تأیید می‌شود.
        </p>

        <div className="mt-5">
          <ByokManager
            inline
            open
            onClose={() => router.push("/chat")}
            onChanged={load}
            providers={providers}
          />
        </div>
      </main>
    </div>
  );
}
