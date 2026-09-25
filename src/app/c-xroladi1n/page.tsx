"use client";

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
  const checkSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Load chart data
  const loadChart = React.useCallback(async (days: number) => {
    setChartLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations?days=${days}`);
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

      setIsAdmin(true);
      setPassword("");
      checkSession();
    } catch {
      setLoginError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setIsAdmin(false);
    setStats(null);
  };

  const refreshAll = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      await loadChart(chartDays);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial loading spinner
  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a] text-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-line border-t-white" />
      </div>
    );
  }

  // =========================================================================
  // Screen 1: Admin Password Login
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#070707] px-4 text-foreground" dir="rtl">
        <div className="w-full max-w-sm rounded-card border border-line bg-[#111111] p-7 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-[#18181b]">
              <Lock className="size-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">ورود به پنل مدیریت</h1>
            <p className="mt-1 text-xs text-foreground-3">
              دسترسی به این بخش نیازمند گذرواژه امنیتی سیستم است.
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-control border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label htmlFor="adminPassword" className="block text-xs font-medium text-foreground-2 mb-1.5">
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
                className="h-10 text-center font-mono text-sm tracking-widest bg-black border-line"
              />
            </div>

            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full h-10 bg-white font-semibold text-black hover:bg-neutral-200 text-xs"
            >
              {loginLoading ? "در حال اعتبارسنجی..." : "ورود به پنل"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-5 text-foreground-3">
            ورودهای ناموفق ثبت و پس از ۵ بار تلاش، دسترسی قفل خواهد شد.
          </p>
        </div>
      </div>
    );
  }

  // Find max count for chart scaling
  const maxChartCount = Math.max(1, ...chartData.map((d) => d.count));

  // =========================================================================
  // Screen 2: Admin Dashboard Layout
  // =========================================================================
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#070707] text-foreground" dir="rtl">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-e border-line bg-[#0d0d0d] p-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 pb-5 border-b border-line">
          <ArkaMark className="size-6 text-white" />
          <div className="flex flex-col">
            <span dir="ltr" className="font-display text-[15px] font-bold text-white">
              ARKA
            </span>
            <span className="text-[10px] font-semibold text-foreground-3 uppercase tracking-wider">
              پنل مدیریت سیستم
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 flex-1 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "dashboard"
                ? "bg-white/10 text-white"
                : "text-foreground-2 hover:bg-soft hover:text-white",
            )}
          >
            <BarChart3 className="size-4" />
            <span>داشبورد کلی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex w-full items-center justify-between rounded-control px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "users"
                ? "bg-white/10 text-white"
                : "text-foreground-2 hover:bg-soft hover:text-white",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Users className="size-4" />
              <span>کاربران</span>
            </span>
            <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9.5px] text-emerald-400 font-medium">
              فعال
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("providers")}
            className={cn(
              "flex w-full items-center justify-between rounded-control px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "providers"
                ? "bg-white/10 text-white"
                : "text-foreground-2 hover:bg-soft hover:text-white",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Server className="size-4" />
              <span>پروایدرها و کلیدها</span>
            </span>
            <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9.5px] text-emerald-400 font-medium">
              فعال
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("broadcasts")}
            className={cn(
              "flex w-full items-center justify-between rounded-control px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "broadcasts"
                ? "bg-white/10 text-white"
                : "text-foreground-2 hover:bg-soft hover:text-white",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Radio className="size-4" />
              <span>پیام‌رسانی</span>
            </span>
            <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9.5px] text-emerald-400 font-medium">
              فعال
            </span>
          </button>
        </nav>

        {/* Admin Footer & Logout */}
        <div className="border-t border-line pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="size-4" />
            <span>خروج از مدیریت</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-[#0a0a0a] px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white">
              {activeTab === "providers"
                ? "مدیریت پروایدرهای هوش مصنوعی و کلیدها"
                : activeTab === "users"
                  ? "مدیریت کاربران سیستم"
                  : activeTab === "broadcasts"
                    ? "پیام‌رسانی و اعلان‌های همگانی"
                    : "داشبورد نظارت و آمار سیستم"}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              سرور فعال
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "dashboard" && (
              <Button
                size="sm"
                variant="outline"
                disabled={statsLoading}
                onClick={refreshAll}
                className="gap-1.5 text-xs h-8"
              >
                <RefreshCw className={cn("size-3", statsLoading && "animate-spin")} />
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
          /* Dashboard Content Area */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* 1. Total Users */}
            <div className="rounded-card border border-line bg-[#121212] p-4 shadow-sm">
              <div className="flex items-center justify-between text-foreground-3">
                <span className="text-xs">کل کاربران</span>
                <Users className="size-4" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-white">
                  {stats ? stats.totalUsers.toLocaleString("fa-IR") : "..."}
                </span>
                <span className="ms-1.5 text-xs text-foreground-3">نفر</span>
              </div>
            </div>

            {/* 2. Total Messages */}
            <div className="rounded-card border border-line bg-[#121212] p-4 shadow-sm">
              <div className="flex items-center justify-between text-foreground-3">
                <span className="text-xs">کل پیام‌ها</span>
                <MessageSquare className="size-4" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-white">
                  {stats ? stats.totalMessages.toLocaleString("fa-IR") : "..."}
                </span>
                <span className="ms-1.5 text-xs text-foreground-3">پیام</span>
              </div>
            </div>

            {/* 3. Online Users (last 5 min) */}
            <div className="rounded-card border border-line bg-[#121212] p-4 shadow-sm">
              <div className="flex items-center justify-between text-foreground-3">
                <span className="text-xs">آنلاین‌های الان</span>
                <Activity className="size-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-emerald-400">
                  {stats ? stats.onlineUsers.toLocaleString("fa-IR") : "..."}
                </span>
                <span className="text-xs text-foreground-3">(۵ دقیقه اخیر)</span>
              </div>
            </div>

            {/* 4. Top User */}
            <div className="rounded-card border border-line bg-[#121212] p-4 shadow-sm">
              <div className="flex items-center justify-between text-foreground-3">
                <span className="text-xs">کاربر پرمصرف</span>
                <Flame className="size-4 text-amber-400" />
              </div>
              <div className="mt-2.5">
                <span className="block truncate text-sm font-bold text-white">
                  {stats?.topUser ? stats.topUser.name : "بدون پیام"}
                </span>
                <span className="text-xs text-foreground-3">
                  {stats?.topUser ? `${stats.topUser.messageCount.toLocaleString("fa-IR")} پیام` : "-"}
                </span>
              </div>
            </div>

            {/* 5. Server Uptime */}
            <div className="rounded-card border border-line bg-[#121212] p-4 shadow-sm">
              <div className="flex items-center justify-between text-foreground-3">
                <span className="text-xs">آپ‌تایم سرور</span>
                <Clock className="size-4" />
              </div>
              <div className="mt-2.5">
                <span className="block truncate text-xs font-semibold text-white">
                  {stats ? stats.uptime : "..."}
                </span>
                <span className="text-[11px] text-foreground-3">بدون قطعی</span>
              </div>
            </div>
          </div>

          {/* Registration Trend Chart Card */}
          <div className="rounded-card border border-line bg-[#111111] p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-line/60 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-white">روند ثبت‌نام کاربران</h2>
                <p className="mt-0.5 text-xs text-foreground-3">
                  مجموع {chartTotal.toLocaleString("fa-IR")} کاربر ثبت‌نام‌شده
                </p>
              </div>

              {/* Range Selector */}
              <div className="flex items-center gap-1 rounded-control border border-line bg-black p-1 text-xs">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setChartDays(d)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs transition-colors",
                      chartDays === d
                        ? "bg-white text-black font-semibold"
                        : "text-foreground-3 hover:text-white",
                    )}
                  >
                    {d} روزه
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Chart */}
            <div className="mt-6">
              {chartLoading ? (
                <div className="flex h-56 items-center justify-center">
                  <div className="size-6 animate-spin rounded-full border-2 border-line border-t-white" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-xs text-foreground-3">
                  داده‌ای برای این بازه یافت نشد.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bar columns */}
                  <div className="flex h-48 items-end gap-1 overflow-x-auto pb-2 pt-4">
                    {chartData.map((item) => {
                      const heightPercent = Math.max(
                        6,
                        Math.round((item.count / maxChartCount) * 100),
                      );

                      return (
                        <div
                          key={item.date}
                          className="group relative flex flex-1 flex-col items-center justify-end h-full min-w-[14px]"
                        >
                          {/* Hover Tooltip */}
                          <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded border border-line bg-popover px-2 py-0.5 text-[10px] text-white shadow group-hover:block">
                            {item.label}: {item.count} کاربر
                          </div>

                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={cn(
                              "w-full rounded-t transition-all duration-200",
                              item.count > 0
                                ? "bg-white hover:bg-neutral-200"
                                : "bg-white/10 hover:bg-white/20",
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* X-axis labels */}
                  <div className="flex justify-between border-t border-line/40 pt-2 text-[10px] text-foreground-3">
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
