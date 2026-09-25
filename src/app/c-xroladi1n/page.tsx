"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Flame,
  Lock,
  LogOut,
  MessageSquare,
  Radio,
  RefreshCw,
  Server,
  Users,
} from "lucide-react";

import { ArkaMark } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProvidersManager } from "@/components/admin/providers-manager";
import { UsersManager } from "@/components/admin/users-manager";
import { BroadcastsManager } from "@/components/admin/broadcasts-manager";
import { adminFetch, getStoredAdminToken, setStoredAdminToken } from "@/lib/admin-fetch";
import { cn } from "@/lib/utils";

interface StatsData {
  totalUsers: number;
  totalMessages: number;
  onlineUsers: number;
  topUser: {
    name: string;
    messageCount: number;
  };
  uptime: string;
  startedAt: number;
}

interface ChartItem {
  date: string;
  label: string;
  count: number;
}

interface ChartResponse {
  totalUsers: number;
  rangeDays: number;
  chartData: ChartItem[];
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [password, setPassword] = React.useState("");
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);

  // Dashboard Data
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(false);

  // Chart Data
  const [chartDays, setChartDays] = React.useState<number>(30);
  const [chartData, setChartData] = React.useState<ChartItem[]>([]);
  const [chartTotal, setChartTotal] = React.useState<number>(0);
  const [chartLoading, setChartLoading] = React.useState(false);

  // Active section in sidebar
  const [activeTab, setActiveTab] = React.useState<"dashboard" | "users" | "providers" | "broadcasts">("dashboard");

  // Check initial admin session by attempting to fetch stats
  const checkSession = React.useCallback(async (explicitToken?: string) => {
    try {
      if (explicitToken) {
        setStoredAdminToken(explicitToken);
      }
      const token = explicitToken || getStoredAdminToken();
      if (!token) {
        setIsAdmin(false);
        return;
      }
      const res = await adminFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setIsAdmin(true);
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        if (!explicitToken) {
          setStoredAdminToken(null);
        }
        setIsAdmin(false);
      }
    } catch {
      // transient network error, keep current state
    }
  }, []);

  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Load chart data
  const loadChart = React.useCallback(async (days: number) => {
    setChartLoading(true);
    try {
      const res = await adminFetch(`/api/admin/registrations?days=${days}`);
      if (res.ok) {
        const data: ChartResponse = await res.json();
        setChartData(data.chartData || []);
        setChartTotal(data.totalUsers || 0);
      }
    } catch (err) {
      console.error("Failed to load chart data:", err);
    } finally {
      setChartLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      loadChart(chartDays);
    }
  }, [isAdmin, chartDays, loadChart]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "رمز عبور نادرست است.");
        return;
      }

      if (data.token) {
        setStoredAdminToken(data.token);
      }

      setIsAdmin(true);
      setPassword("");
      await checkSession(data.token);
    } catch {
      setLoginError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setStoredAdminToken(null);
    setIsAdmin(false);
    setStats(null);
  };

  const refreshAll = async () => {
    setStatsLoading(true);
    try {
      const res = await adminFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      await loadChart(chartDays);
    } finally {
      setStatsLoading(false);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#070709] text-white">
        <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  // =========================================================================
  // Screen 1: Admin Password Login
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#070709] px-4 text-foreground" dir="rtl">
        <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#111114] p-8 shadow-[0_24px_50px_rgba(0,0,0,0.8)]">
          <div className="text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/5">
              <Lock className="size-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">ورود به پنل مدیریت</h1>
            <p className="mt-1 text-xs text-neutral-400">
              دسترسی به این بخش نیازمند گذرواژه امنیتی سیستم است.
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label htmlFor="adminPassword" className="block text-xs font-medium text-neutral-300 mb-1.5">
                گذرواژه مدیریت
              </label>
              <Input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                dir="ltr"
                autoFocus
                required
                className="h-10 text-center font-mono text-sm tracking-widest bg-black/60 border-white/10 text-white rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full h-10 bg-white font-bold text-black hover:bg-neutral-200 text-xs rounded-xl shadow"
            >
              {loginLoading ? "در حال اعتبارسنجی..." : "ورود به پنل"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-5 text-neutral-500">
            ورودهای ناموفق ثبت و پس از ۵ بار تلاش، دسترسی قفل خواهد شد.
          </p>
        </div>
      </div>
    );
  }

  const maxChartCount = Math.max(1, ...chartData.map((d) => d.count));

  // =========================================================================
  // Screen 2: Admin Dashboard Layout (Spacious, Video 2-inspired)
  // =========================================================================
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#070709] text-foreground" dir="rtl">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-e border-white/5 bg-[#0b0b0e] p-5">
        <div className="flex items-center gap-2.5 pb-5 border-b border-white/5">
          <ArkaMark className="size-6 text-white" />
          <div className="flex flex-col">
            <span dir="ltr" className="font-display text-[15px] font-bold text-white tracking-tight">
              ARKA
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              پنل مدیریت سیستم
            </span>
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
              activeTab === "dashboard"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <BarChart3 className="size-4" />
            <span>داشبورد کلی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
              activeTab === "users"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <span className="flex items-center gap-3">
              <Users className="size-4" />
              <span>کاربران</span>
            </span>
            <span className={cn(
              "rounded-full px-2 py-0.2 text-[9.5px] font-mono",
              activeTab === "users" ? "bg-black/10 text-black font-bold" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            )}>
              فعال
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("providers")}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
              activeTab === "providers"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <span className="flex items-center gap-3">
              <Server className="size-4" />
              <span>پروایدرها و کلیدها</span>
            </span>
            <span className={cn(
              "rounded-full px-2 py-0.2 text-[9.5px] font-mono",
              activeTab === "providers" ? "bg-black/10 text-black font-bold" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            )}>
              فعال
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("broadcasts")}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
              activeTab === "broadcasts"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <span className="flex items-center gap-3">
              <Radio className="size-4" />
              <span>پیام‌رسانی</span>
            </span>
            <span className={cn(
              "rounded-full px-2 py-0.2 text-[9.5px] font-mono",
              activeTab === "broadcasts" ? "bg-black/10 text-black font-bold" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            )}>
              فعال
            </span>
          </button>
        </nav>

        <div className="border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="size-4" />
            <span>خروج از پنل مدیریت</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#09090c] px-8">
          <div className="flex items-center gap-3.5">
            <h1 className="text-sm font-bold text-white">
              {activeTab === "providers"
                ? "مدیریت پروایدرهای متمرکز و خوشه‌های چندکلیدی"
                : activeTab === "users"
                  ? "مدیریت و نظارت بر کاربران سیستم"
                  : activeTab === "broadcasts"
                    ? "پیام‌رسانی و اعلان‌های همگانی"
                    : "داشبورد نظارت و آمار سامانه"}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              سرور پایدار و فعال
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === "dashboard" && (
              <Button
                size="sm"
                variant="outline"
                disabled={statsLoading}
                onClick={refreshAll}
                className="gap-2 text-xs h-8 rounded-full border-white/10 hover:border-white/30 text-neutral-300 hover:text-white"
              >
                <RefreshCw className={cn("size-3.5", statsLoading && "animate-spin")} />
                <span>به‌روزرسانی داده‌ها</span>
              </Button>
            )}
          </div>
        </header>

        {activeTab === "providers" ? (
          <ProvidersManager />
        ) : activeTab === "users" ? (
          <UsersManager />
        ) : activeTab === "broadcasts" ? (
          <BroadcastsManager />
        ) : (
          /* Dashboard Content Area with Generous Spacing */
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* 5 KPI Metric Cards (Rounded [24px], Spacious) */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* 1. Total Users */}
              <div className="rounded-[24px] border border-white/10 bg-[#101013] p-6 shadow-sm transition-all hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">کل کاربران سامانه</span>
                  <div className="size-8 rounded-xl bg-white/[0.04] border border-white/10 grid place-items-center text-white">
                    <Users className="size-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {stats ? stats.totalUsers.toLocaleString("fa-IR") : "..."}
                  </span>
                  <span className="text-xs text-neutral-400">نفر</span>
                </div>
                <div className="mt-2 text-[11px] text-neutral-500 font-sans">
                  حساب‌های فعال گوگل
                </div>
              </div>

              {/* 2. Total Messages */}
              <div className="rounded-[24px] border border-white/10 bg-[#101013] p-6 shadow-sm transition-all hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">مجموع پیام‌ها</span>
                  <div className="size-8 rounded-xl bg-white/[0.04] border border-white/10 grid place-items-center text-white">
                    <MessageSquare className="size-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {stats ? stats.totalMessages.toLocaleString("fa-IR") : "..."}
                  </span>
                  <span className="text-xs text-neutral-400">پیام</span>
                </div>
                <div className="mt-2 text-[11px] text-neutral-500 font-sans">
                  ترافیک چت و استودیو
                </div>
              </div>

              {/* 3. Online Users (last 5 min) */}
              <div className="rounded-[24px] border border-white/10 bg-[#101013] p-6 shadow-sm transition-all hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">کاربران آنلاین</span>
                  <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 grid place-items-center text-emerald-400">
                    <Activity className="size-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-emerald-400 tracking-tight">
                    {stats ? stats.onlineUsers.toLocaleString("fa-IR") : "..."}
                  </span>
                  <span className="text-xs text-neutral-400">نفر</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-400/80 font-sans">
                  فعال در ۵ دقیقه اخیر
                </div>
              </div>

              {/* 4. Top User */}
              <div className="rounded-[24px] border border-white/10 bg-[#101013] p-6 shadow-sm transition-all hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">کاربر پرمصرف</span>
                  <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/30 grid place-items-center text-amber-400">
                    <Flame className="size-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="block truncate text-sm font-bold text-white">
                    {stats?.topUser ? stats.topUser.name : "بدون پیام"}
                  </span>
                  <span className="text-xs text-neutral-400 mt-1 block">
                    {stats?.topUser ? `${stats.topUser.messageCount.toLocaleString("fa-IR")} پیام ارسالی` : "-"}
                  </span>
                </div>
              </div>

              {/* 5. Server Uptime */}
              <div className="rounded-[24px] border border-white/10 bg-[#101013] p-6 shadow-sm transition-all hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">آپ‌تایم سامانه</span>
                  <div className="size-8 rounded-xl bg-white/[0.04] border border-white/10 grid place-items-center text-white">
                    <Clock className="size-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="block truncate font-mono text-sm font-bold text-white" dir="ltr">
                    {stats ? stats.uptime : "..."}
                  </span>
                  <span className="text-[11px] text-emerald-400 mt-1 block">
                    وضعیت پایدار سرور
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Trend Chart Card (Inspired by Video 2) */}
            <div className="rounded-[28px] border border-white/10 bg-[#101013] p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-5 border-b border-white/5 pb-6 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {chartTotal.toLocaleString("fa-IR")}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-neutral-300 font-medium">
                      کاربر ثبت‌شده
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-neutral-400">
                    روند پیوستن کاربران جدید به سامانه هوش مصنوعی ارکا
                  </p>
                </div>

                {/* Video 2-Style Segmented Pill */}
                <div className="inline-flex items-center rounded-full border border-white/15 bg-black/60 p-1 text-xs">
                  {[
                    { label: "۷ روز", days: 7 },
                    { label: "۳۰ روز", days: 30 },
                    { label: "۹۰ روز", days: 90 },
                  ].map((tab) => (
                    <button
                      key={tab.days}
                      type="button"
                      onClick={() => setChartDays(tab.days)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                        chartDays === tab.days
                          ? "bg-white text-black shadow-md scale-105"
                          : "text-neutral-400 hover:text-white",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Chart with Guide Lines */}
              <div className="mt-8">
                {chartLoading ? (
                  <div className="flex h-56 items-center justify-center">
                    <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-xs text-neutral-500">
                    داده‌ای برای این بازه یافت نشد.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative h-56 flex flex-col justify-between">
                      {/* Hairline horizontal dotted guidelines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="border-b border-dashed border-white/30 w-full" />
                        <div className="border-b border-dashed border-white/30 w-full" />
                        <div className="border-b border-dashed border-white/30 w-full" />
                        <div className="border-b border-white/40 w-full" />
                      </div>

                      {/* Slender modern bars */}
                      <div className="relative z-10 flex h-full items-end gap-1.5 overflow-x-auto pb-1 pt-4">
                        {chartData.map((item) => {
                          const heightPercent = Math.max(
                            6,
                            Math.round((item.count / maxChartCount) * 100),
                          );

                          return (
                            <div
                              key={item.date}
                              className="group relative flex flex-1 flex-col items-center justify-end h-full min-w-[12px]"
                            >
                              <div className="pointer-events-none absolute -top-8 z-20 hidden whitespace-nowrap rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-[11px] font-mono text-white shadow-xl group-hover:block">
                                {item.label}: {item.count} کاربر
                              </div>

                              <div
                                style={{ height: `${heightPercent}%` }}
                                className={cn(
                                  "w-full rounded-t-[4px] transition-all duration-300",
                                  item.count > 0
                                    ? "bg-white hover:bg-neutral-200 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                                    : "bg-white/10 hover:bg-white/20",
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-white/10 pt-3 text-[11px] font-mono text-neutral-400">
                      <span>{chartData[0]?.label}</span>
                      <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
                      <span>{chartData[chartData.length - 1]?.label}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
