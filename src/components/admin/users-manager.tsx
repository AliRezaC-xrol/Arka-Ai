"use client";

import { adminFetch } from "@/lib/admin-fetch";

import * as React from "react";
import {
  Ban,
  CheckCircle,
  Clock,
  ExternalLink,
  Key,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AdminUserListItem {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string;
  lastActiveAt: string;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  timeoutUntil: string | null;
  timeoutReason: string | null;
  computedStatus: "active" | "banned" | "timeout";
  totalMessages: number;
  totalTokensUsed: number;
  personalProvidersCount: number;
  conversationsCount: number;
}

export interface UserDetailsData {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string;
  lastActiveAt: string;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  timeoutUntil: string | null;
  timeoutReason: string | null;
  computedStatus: "active" | "banned" | "timeout";
  totalMessages: number;
  personalProvidersCount: number;
  conversationsCount: number;
  tokens: {
    total: number;
    prompt: number;
    completion: number;
  };
  recentConversations: Array<{
    id: string;
    title: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    _count: { messages: number };
  }>;
  recentUsage: Array<{
    model: string;
    promptTokens: number;
    completionTokens: number;
    tokensUsed: number;
    createdAt: string;
    provider: { name: string; type: string };
  }>;
}

export function UsersManager() {
  const [users, setUsers] = React.useState<AdminUserListItem[]>([]);
  const [stats, setStats] = React.useState<{ total: number; active: number; banned: number; timedOut: number }>({
    total: 0,
    active: 0,
    banned: 0,
    timedOut: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "banned" | "timeout">("all");
  const [sortBy, setSortBy] = React.useState<"createdAt_desc" | "createdAt_asc" | "messages_desc" | "tokens_desc">("createdAt_desc");

  // Selected User Details Modal
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [userDetails, setUserDetails] = React.useState<UserDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);

  // Ban Modal
  const [banUserTarget, setBanUserTarget] = React.useState<AdminUserListItem | null>(null);
  const [banReasonInput, setBanReasonInput] = React.useState("");
  const [banSubmitting, setBanSubmitting] = React.useState(false);

  // Timeout Modal
  const [timeoutUserTarget, setTimeoutUserTarget] = React.useState<AdminUserListItem | null>(null);
  const [timeoutDurationOption, setTimeoutDurationOption] = React.useState<"10" | "60" | "1440" | "custom">("10");
  const [customTimeoutMinutes, setCustomTimeoutMinutes] = React.useState("30");
  const [timeoutReasonInput, setTimeoutReasonInput] = React.useState("");
  const [timeoutSubmitting, setTimeoutSubmitting] = React.useState(false);

  // Action loading state
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Live countdown ticker for visible timeout items
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Users
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/users", window.location.origin);
      if (search.trim()) url.searchParams.set("search", search.trim());
      url.searchParams.set("status", statusFilter);
      url.searchParams.set("sort", sortBy);

      const res = await adminFetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch admin users", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch single user details
  const openUserDetails = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserDetails(data.user);
      }
    } catch (err) {
      console.error("Failed to load user details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Perform Ban
  const handleConfirmBan = async () => {
    if (!banUserTarget) return;
    setBanSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/users/${banUserTarget.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReasonInput || "مسدودسازی توسط مدیر سیستم" }),
      });
      if (res.ok) {
        setBanUserTarget(null);
        setBanReasonInput("");
        fetchUsers();
        if (selectedUserId === banUserTarget.id) {
          openUserDetails(banUserTarget.id);
        }
      }
    } catch (err) {
      console.error("Ban user failed", err);
    } finally {
      setBanSubmitting(false);
    }
  };

  // Perform Unban
  const handleQuickUnban = async (user: AdminUserListItem | { id: string }) => {
    setActionLoadingId(user.id);
    try {
      const res = await adminFetch(`/api/admin/users/${user.id}/unban`, {
        method: "POST",
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUserId === user.id) {
          openUserDetails(user.id);
        }
      }
    } catch (err) {
      console.error("Unban failed", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Perform Timeout
  const handleConfirmTimeout = async () => {
    if (!timeoutUserTarget) return;
    setTimeoutSubmitting(true);

    let minutes = 10;
    if (timeoutDurationOption === "60") minutes = 60;
    else if (timeoutDurationOption === "1440") minutes = 1440;
    else if (timeoutDurationOption === "custom") {
      minutes = Math.max(1, parseInt(customTimeoutMinutes, 10) || 10);
    }

    try {
      const res = await adminFetch(`/api/admin/users/${timeoutUserTarget.id}/timeout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: minutes,
          reason: timeoutReasonInput || "محدودیت موقت دسترسی",
        }),
      });
      if (res.ok) {
        setTimeoutUserTarget(null);
        setTimeoutReasonInput("");
        fetchUsers();
        if (selectedUserId === timeoutUserTarget.id) {
          openUserDetails(timeoutUserTarget.id);
        }
      }
    } catch (err) {
      console.error("Timeout user failed", err);
    } finally {
      setTimeoutSubmitting(false);
    }
  };

  // Remove Timeout
  const handleQuickRemoveTimeout = async (user: AdminUserListItem | { id: string }) => {
    setActionLoadingId(user.id);
    try {
      const res = await adminFetch(`/api/admin/users/${user.id}/remove-timeout`, {
        method: "POST",
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUserId === user.id) {
          openUserDetails(user.id);
        }
      }
    } catch (err) {
      console.error("Remove timeout failed", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper: format remaining timeout countdown
  const getRemainingTimeString = (timeoutUntil: string | null) => {
    if (!timeoutUntil) return null;
    const diffMs = new Date(timeoutUntil).getTime() - Date.now();
    if (diffMs <= 0) return "منقضی‌شده (آزاد)";

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours} ساعت و ${minutes} دقیقه دیگر`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")} دقیقه دیگر`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" dir="rtl">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-white" />
            <h2 className="text-lg font-bold text-white">مدیریت کاربران و نظارت بر دسترسی‌ها</h2>
          </div>
          <p className="mt-1 text-xs text-foreground-3">
            مشاهده کامل حساب‌ها، تاریخچه فعالیت، جزئیات مصرف، اعمال مسدودیت (Ban) و محدودیت موقت (Timeout).
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchUsers}
          className="gap-1.5 text-xs h-8 text-foreground-2 hover:text-white"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          <span>بازخوانی</span>
        </Button>
      </div>

      {/* Tabs & Search / Filter Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-line pb-4">
        {/* Status Filter Tabs with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-3 py-1.5 font-medium transition-colors whitespace-nowrap",
              statusFilter === "all"
                ? "bg-white text-black font-semibold"
                : "text-foreground-3 hover:text-white hover:bg-white/5",
            )}
          >
            <span>همه کاربران</span>
            <span className="font-mono text-[11px] opacity-80">({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-3 py-1.5 font-medium transition-colors whitespace-nowrap",
              statusFilter === "active"
                ? "bg-white text-black font-semibold"
                : "text-foreground-3 hover:text-white hover:bg-white/5",
            )}
          >
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>عادی</span>
            <span className="font-mono text-[11px] opacity-80">({stats.active})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("banned")}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-3 py-1.5 font-medium transition-colors whitespace-nowrap",
              statusFilter === "banned"
                ? "bg-white text-black font-semibold"
                : "text-foreground-3 hover:text-white hover:bg-white/5",
            )}
          >
            <Ban className="size-3.5 text-red-400" />
            <span>بن‌شده‌ها</span>
            <span className="font-mono text-[11px] opacity-80">({stats.banned})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("timeout")}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-3 py-1.5 font-medium transition-colors whitespace-nowrap",
              statusFilter === "timeout"
                ? "bg-white text-black font-semibold"
                : "text-foreground-3 hover:text-white hover:bg-white/5",
            )}
          >
            <Clock className="size-3.5 text-amber-400" />
            <span>تایم‌اوت‌شده‌ها</span>
            <span className="font-mono text-[11px] opacity-80">({stats.timedOut})</span>
          </button>
        </div>

        {/* Search & Sort Dropdowns */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو با نام یا ایمیل..."
              className="h-8 ps-8 pe-3 text-xs bg-[#111113] border-line"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-foreground-3 hover:text-white"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Sort Selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-8 rounded-control border border-line bg-[#111113] px-2.5 text-xs text-foreground focus:border-white focus:outline-none w-full sm:w-auto"
          >
            <option value="createdAt_desc">ثبت‌نام (جدیدترین)</option>
            <option value="createdAt_asc">ثبت‌نام (قدیمی‌ترین)</option>
            <option value="messages_desc">میزان مصرف (بیشترین پیام)</option>
            <option value="tokens_desc">میزان مصرف (بیشترین توکن)</option>
          </select>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="rounded-card border border-line bg-[#111113] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-black/40 text-foreground-3 font-semibold">
                <th className="py-3 px-4 text-start">کاربر</th>
                <th className="py-3 px-4 text-start">تاریخ و ساعت ساخت</th>
                <th className="py-3 px-4 text-start">آخرین فعالیت</th>
                <th className="py-3 px-4 text-center">پیام‌ها / توکن‌ها</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-end">اقدامات مدیریتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-foreground-3">
                    کاربری با این مشخصات یا فیلتر یافت نشد.
                  </td>
                </tr>
              )}

              {users.map((u) => {
                const isBanned = u.isBanned;
                const isTimedOut = Boolean(!isBanned && u.timeoutUntil && new Date(u.timeoutUntil) > new Date());
                const remainingTime = isTimedOut ? getRemainingTimeString(u.timeoutUntil) : null;
                const isActionLoading = actionLoadingId === u.id;

                return (
                  <tr
                    key={u.id}
                    className={cn(
                      "transition-colors hover:bg-white/[0.02]",
                      isBanned && "bg-red-500/[0.03]",
                      isTimedOut && "bg-amber-500/[0.03]",
                    )}
                  >
                    {/* User Identity Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => openUserDetails(u.id)}
                          className="size-8 rounded-full border border-line bg-neutral-800 grid place-items-center shrink-0 cursor-pointer overflow-hidden font-bold text-white text-[11px]"
                        >
                          {u.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatarUrl} alt={u.name || "User"} className="size-full object-cover" />
                          ) : (
                            u.name ? u.name.charAt(0).toUpperCase() : <UserIcon className="size-3.5" />
                          )}
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => openUserDetails(u.id)}
                            className="font-bold text-white hover:underline text-start flex items-center gap-1.5"
                          >
                            <span>{u.name || "کاربر بدون نام"}</span>
                            <ExternalLink className="size-3 text-foreground-3" />
                          </button>
                          <span dir="ltr" className="font-mono text-[10.5px] text-foreground-3 block text-start">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Exact Registration Date & Time */}
                    <td className="py-3 px-4 font-mono text-[11px] text-foreground-2">
                      <div>
                        {new Date(u.createdAt).toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-foreground-3">
                        {new Date(u.createdAt).toLocaleTimeString("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 text-[11px] text-foreground-3 font-mono">
                      {new Date(u.lastActiveAt).toLocaleDateString("fa-IR")}
                      <span className="block text-[10px]">
                        {new Date(u.lastActiveAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>

                    {/* Messages & Tokens */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="text-white font-semibold block">
                        {u.totalMessages.toLocaleString("fa-IR")} پیام
                      </span>
                      <span className="text-[10.5px] text-foreground-3 block">
                        {u.totalTokensUsed.toLocaleString("fa-IR")} توکن
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {isBanned ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10.5px] text-red-300 font-medium">
                            <Ban className="size-3" />
                            <span>مسدود (بن‌شده)</span>
                          </span>
                          {u.bannedAt && (
                            <span className="text-[9.5px] text-red-400 mt-0.5 font-mono">
                              {new Date(u.bannedAt).toLocaleDateString("fa-IR")}
                            </span>
                          )}
                        </div>
                      ) : isTimedOut ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10.5px] text-amber-300 font-medium">
                            <Clock className="size-3" />
                            <span>تایم‌اوت فعال</span>
                          </span>
                          <span className="text-[9.5px] text-amber-400 mt-0.5 font-mono" dir="ltr">
                            {remainingTime}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10.5px] text-emerald-300 font-medium">
                          <CheckCircle className="size-3" />
                          <span>عادی</span>
                        </span>
                      )}
                    </td>

                    {/* Administrative Action Buttons */}
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ban / Unban Button */}
                        {isBanned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActionLoading}
                            onClick={() => handleQuickUnban(u)}
                            className="h-7 text-[11px] text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            رفع بن
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isActionLoading}
                            onClick={() => {
                              setBanUserTarget(u);
                              setBanReasonInput("");
                            }}
                            className="h-7 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            بن کردن
                          </Button>
                        )}

                        {/* Timeout / Lift Timeout Button */}
                        {isTimedOut ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActionLoading}
                            onClick={() => handleQuickRemoveTimeout(u)}
                            className="h-7 text-[11px] text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                          >
                            حذف تایم‌اوت
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isBanned || isActionLoading}
                            onClick={() => {
                              setTimeoutUserTarget(u);
                              setTimeoutDurationOption("10");
                              setTimeoutReasonInput("");
                            }}
                            className="h-7 text-[11px] text-foreground-3 hover:text-white"
                          >
                            تایم‌اوت
                          </Button>
                        )}

                        {/* Details Modal Trigger */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openUserDetails(u.id)}
                          className="h-7 text-[11px] text-foreground-2 hover:text-white"
                        >
                          جزئیات
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modal 1: User Full Details */}
      {/* ========================================================================= */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-card border border-line bg-[#141416] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserIcon className="size-4" />
                <span>پرونده کامل کاربر</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                className="text-foreground-3 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {detailsLoading || !userDetails ? (
              <div className="py-16 flex items-center justify-center">
                <RefreshCw className="size-6 animate-spin text-foreground-3" />
              </div>
            ) : (
              <div className="mt-4 space-y-6 text-xs">
                {/* Profile Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-control border border-line bg-black/40 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full border border-line bg-neutral-800 grid place-items-center text-lg font-bold text-white overflow-hidden shrink-0">
                      {userDetails.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={userDetails.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        userDetails.name?.charAt(0) || "U"
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{userDetails.name || "کاربر بدون نام"}</h4>
                      <span dir="ltr" className="text-foreground-3 font-mono block text-start">
                        {userDetails.email}
                      </span>
                      <span className="text-[10px] text-foreground-3 mt-0.5 block font-mono">
                        شناسه: {userDetails.id}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    {userDetails.isBanned ? (
                      <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-red-300 font-bold flex items-center gap-1.5">
                        <Ban className="size-3.5" />
                        مسدود (بن‌شده)
                      </span>
                    ) : userDetails.timeoutUntil && new Date(userDetails.timeoutUntil) > new Date() ? (
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-amber-300 font-bold flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        تایم‌اوت فعال
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-emerald-300 font-bold flex items-center gap-1.5">
                        <CheckCircle className="size-3.5" />
                        حساب عادی
                      </span>
                    )}

                    {userDetails.banReason && (
                      <span className="text-[10.5px] text-red-400">علت بن: {userDetails.banReason}</span>
                    )}
                    {userDetails.timeoutReason && (
                      <span className="text-[10.5px] text-amber-300">علت محدودیت: {userDetails.timeoutReason}</span>
                    )}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-control border border-line bg-soft/50">
                    <span className="text-foreground-3 text-[11px] block">کل پیام‌ها</span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {userDetails.totalMessages.toLocaleString("fa-IR")}
                    </span>
                  </div>

                  <div className="p-3 rounded-control border border-line bg-soft/50">
                    <span className="text-foreground-3 text-[11px] block">کل توکن‌های مصرفی</span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {userDetails.tokens.total.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[10px] text-foreground-3 block">
                      ورودی: {userDetails.tokens.prompt} | خروجی: {userDetails.tokens.completion}
                    </span>
                  </div>

                  <div className="p-3 rounded-control border border-line bg-soft/50">
                    <span className="text-foreground-3 text-[11px] block flex items-center gap-1">
                      <Key className="size-3 text-amber-400" />
                      پروایدرهای شخصی
                    </span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {userDetails.personalProvidersCount.toLocaleString("fa-IR")} پروایدر
                    </span>
                    <span className="text-[10px] text-foreground-3 block">
                      (فقط تعداد کلیدها، بدون محتوا)
                    </span>
                  </div>

                  <div className="p-3 rounded-control border border-line bg-soft/50">
                    <span className="text-foreground-3 text-[11px] block">تعداد گفتگوها</span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {userDetails.conversationsCount.toLocaleString("fa-IR")} گفتگو
                    </span>
                  </div>
                </div>

                {/* Activity Dates Breakdown */}
                <div className="p-3 rounded-control border border-line bg-black/30 space-y-2">
                  <h5 className="font-bold text-white text-xs">تاریخچه فعالیت کاربر</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-foreground-3 block">تاریخ دقیق ثبت‌نام:</span>
                      <span className="font-mono text-foreground-2">
                        {new Date(userDetails.createdAt).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div>
                      <span className="text-foreground-3 block">آخرین ورود (Login):</span>
                      <span className="font-mono text-foreground-2">
                        {new Date(userDetails.lastLoginAt).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div>
                      <span className="text-foreground-3 block">آخرین فعالیت (Activity):</span>
                      <span className="font-mono text-foreground-2">
                        {new Date(userDetails.lastActiveAt).toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Usage Logs List */}
                {userDetails.recentUsage.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Zap className="size-3.5 text-foreground-3" />
                      <span>آخرین مصارف هوش مصنوعی کاربر</span>
                    </h5>
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-control border border-line p-2 bg-black/40">
                      {userDetails.recentUsage.map((log, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded hover:bg-white/5 font-mono"
                        >
                          <span className="text-foreground-2">
                            {log.provider?.name || "پروایدر"} / {log.model}
                          </span>
                          <span className="text-foreground-3">
                            {log.tokensUsed} توکن ({new Date(log.createdAt).toLocaleTimeString("fa-IR")})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons in Modal */}
                <div className="flex items-center justify-between pt-3 border-t border-line">
                  <div className="flex items-center gap-2">
                    {userDetails.isBanned ? (
                      <Button
                        size="sm"
                        onClick={() => handleQuickUnban(userDetails)}
                        className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        رفع مسدودیت کاربر
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          const target = users.find((u) => u.id === userDetails.id) || null;
                          if (target) {
                            setBanUserTarget(target);
                            setBanReasonInput("");
                          }
                        }}
                        className="h-8 text-xs bg-red-600 text-white hover:bg-red-700"
                      >
                        مسدودسازی (بن)
                      </Button>
                    )}

                    {userDetails.timeoutUntil && new Date(userDetails.timeoutUntil) > new Date() ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickRemoveTimeout(userDetails)}
                        className="h-8 text-xs text-amber-300 border-amber-500/30"
                      >
                        حذف محدودیت تایم‌اوت
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={userDetails.isBanned}
                        onClick={() => {
                          const target = users.find((u) => u.id === userDetails.id) || null;
                          if (target) {
                            setTimeoutUserTarget(target);
                            setTimeoutDurationOption("10");
                            setTimeoutReasonInput("");
                          }
                        }}
                        className="h-8 text-xs"
                      >
                        اعمال تایم‌اوت
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedUserId(null);
                      setUserDetails(null);
                    }}
                    className="h-8 text-xs"
                  >
                    بستن
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 2: Ban User */}
      {/* ========================================================================= */}
      {banUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-card border border-red-500/30 bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl border border-red-500/30 bg-red-500/10 grid place-items-center shrink-0">
                <ShieldAlert className="size-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  مسدودسازی کاربر «{banUserTarget.name || banUserTarget.email}»
                </h3>
                <p className="mt-1 text-xs text-foreground-3 leading-relaxed">
                  با بن شدن کاربر، دسترسی به ورود و ارسال پیام در چت بلافاصله قطع گردیده و پیام مسدودیت نمایش داده خواهد شد.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-foreground-2 font-medium mb-1">
                  دلیل مسدودسازی (جهت یادداشت داخلی مدیریت):
                </label>
                <Input
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="مثلاً: اسپم مداوم، نقض قوانین سرویس، سوءاستفاده از API"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={banSubmitting}
                onClick={() => setBanUserTarget(null)}
                className="h-9 text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={banSubmitting}
                onClick={handleConfirmBan}
                className="h-9 text-xs bg-red-600 text-white hover:bg-red-700"
              >
                {banSubmitting ? "در حال مسدودسازی..." : "تأیید و مسدودسازی کاربر"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 3: Timeout User */}
      {/* ========================================================================= */}
      {timeoutUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-card border border-amber-500/30 bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl border border-amber-500/30 bg-amber-500/10 grid place-items-center shrink-0">
                <Clock className="size-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  محدودیت موقت (Timeout) برای «{timeoutUserTarget.name || timeoutUserTarget.email}»
                </h3>
                <p className="mt-1 text-xs text-foreground-3 leading-relaxed">
                  کاربر در محیط چت شمارش معکوس زنده مشاهده می‌کند و پس از اتمام زمان، دسترسی خودکار برمی‌گردد.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-foreground-2 font-medium mb-1.5">مدت زمان محدودیت:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "۱۰ دقیقه", val: "10" },
                    { label: "۱ ساعت", val: "60" },
                    { label: "۱ روز", val: "1440" },
                    { label: "سفارشی", val: "custom" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setTimeoutDurationOption(opt.val as typeof timeoutDurationOption)}
                      className={cn(
                        "rounded-control p-2 text-center text-xs font-medium border transition-colors",
                        timeoutDurationOption === opt.val
                          ? "border-amber-400 bg-amber-500/20 text-white font-bold"
                          : "border-line bg-card text-foreground-3 hover:text-white",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {timeoutDurationOption === "custom" && (
                <div>
                  <label className="block text-foreground-2 font-medium mb-1">تعداد دقیقه دلخواه:</label>
                  <Input
                    type="number"
                    min="1"
                    max="43200"
                    value={customTimeoutMinutes}
                    onChange={(e) => setCustomTimeoutMinutes(e.target.value)}
                    dir="ltr"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-foreground-2 font-medium mb-1">
                  علت محدودیت (اختیاری):
                </label>
                <Input
                  value={timeoutReasonInput}
                  onChange={(e) => setTimeoutReasonInput(e.target.value)}
                  placeholder="مثلاً: نرخ ارسال بیش از حد بالا"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={timeoutSubmitting}
                onClick={() => setTimeoutUserTarget(null)}
                className="h-9 text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={timeoutSubmitting}
                onClick={handleConfirmTimeout}
                className="h-9 text-xs bg-amber-500 text-black hover:bg-amber-400 font-bold"
              >
                {timeoutSubmitting ? "در حال اعمال..." : "اعمال محدودیت موقت"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
