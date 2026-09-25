"use client";

import { adminFetch } from "@/lib/admin-fetch";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Cpu,
  Key,
  Layers,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  TrendingUp,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ProviderApiKeyData {
  id: string;
  label: string;
  keyMask: string;
  status: "active" | "exhausted" | "error";
  lastUsedAt: string | null;
  lastErrorMessage: string | null;
  usageCount: number;
  createdAt: string;
}

export interface ProviderData {
  id: string;
  name: string;
  type: string;
  baseUrl: string | null;
  isActive: boolean;
  models: string;
  createdAt: string;
  updatedAt: string;
  apiKeys: ProviderApiKeyData[];
  _count?: {
    usageLogs: number;
  };
}

export interface UsageSummary {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalRequests: number;
  topProvider: {
    providerId: string;
    name: string;
    type: string;
    tokens: number;
    requests: number;
  } | null;
  topModel: {
    model: string;
    tokens: number;
    requests: number;
  } | null;
}

export interface ProviderUsageStat {
  providerId: string;
  name: string;
  type: string;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  requests: number;
}

export interface TopUserStat {
  userId: string;
  name: string;
  email: string;
  tokens: number;
  requests: number;
}

export function ProvidersManager() {
  const [providers, setProviders] = React.useState<ProviderData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Usage Analytics State
  const [analyticsPeriod, setAnalyticsPeriod] = React.useState<"day" | "week" | "month">("week");
  const [selectedAnalyticsProviderId, setSelectedAnalyticsProviderId] = React.useState<string | null>(null);
  const [usageSummary, setUsageSummary] = React.useState<UsageSummary | null>(null);
  const [providerStats, setProviderStats] = React.useState<ProviderUsageStat[]>([]);
  const [topUsers, setTopUsers] = React.useState<TopUserStat[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);

  // Expanded provider cards for keys
  const [expandedProviderId, setExpandedProviderId] = React.useState<string | null>(null);

  // Modals state
  const [isAddProviderOpen, setIsAddProviderOpen] = React.useState(false);
  const [editingProvider, setEditingProvider] = React.useState<ProviderData | null>(null);
  const [addingKeyProvider, setAddingKeyProvider] = React.useState<ProviderData | null>(null);
  const [deletingProvider, setDeletingProvider] = React.useState<ProviderData | null>(null);
  const [deletingKey, setDeletingKey] = React.useState<{ providerId: string; key: ProviderApiKeyData } | null>(null);

  // Form states
  const [formName, setFormName] = React.useState("");
  const [formType, setFormType] = React.useState("openai");
  const [formBaseUrl, setFormBaseUrl] = React.useState("");
  const [formModels, setFormModels] = React.useState("");
  const [formApiKey, setFormApiKey] = React.useState("");
  const [formKeyLabel, setFormKeyLabel] = React.useState("");
  const [formSubmitLoading, setFormSubmitLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Fetch Providers
  const fetchProviders = React.useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/providers");
      if (!res.ok) throw new Error("دریافت پروایدرها با خطا مواجه شد.");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Usage Analytics
  const fetchUsage = React.useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const url = new URL("/api/admin/usage", window.location.origin);
      url.searchParams.set("period", analyticsPeriod);
      if (selectedAnalyticsProviderId) {
        url.searchParams.set("providerId", selectedAnalyticsProviderId);
      }
      const res = await adminFetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setUsageSummary(data.summary || null);
        setProviderStats(data.providerComparison || []);
        setTopUsers(data.topUsers || []);
      }
    } catch (err) {
      console.error("Failed to load usage stats", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsPeriod, selectedAnalyticsProviderId]);

  React.useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  React.useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Toggle Provider Active Status
  const handleToggleActive = async (provider: ProviderData) => {
    try {
      const newStatus = !provider.isActive;
      // Optimistic update
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, isActive: newStatus } : p)),
      );

      const res = await adminFetch(`/api/admin/providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) {
        // Rollback on error
        fetchProviders();
      }
    } catch {
      fetchProviders();
    }
  };

  // Submit Add Provider
  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitLoading(true);
    setFormError(null);

    try {
      const res = await adminFetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          type: formType,
          baseUrl: formBaseUrl || null,
          models: formModels,
          apiKey: formApiKey || undefined,
          keyLabel: formKeyLabel || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ایجاد پروایدر");
      }

      setIsAddProviderOpen(false);
      resetForm();
      fetchProviders();
      fetchUsage();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Submit Edit Provider
  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setFormSubmitLoading(true);
    setFormError(null);

    try {
      const res = await adminFetch(`/api/admin/providers/${editingProvider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          type: formType,
          baseUrl: formBaseUrl || null,
          models: formModels,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ویرایش پروایدر");
      }

      setEditingProvider(null);
      resetForm();
      fetchProviders();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Submit Add Key
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingKeyProvider) return;
    setFormSubmitLoading(true);
    setFormError(null);

    try {
      const res = await adminFetch(`/api/admin/providers/${addingKeyProvider.id}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formKeyLabel || "کلید جانشین",
          apiKey: formApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت کلید");
      }

      setAddingKeyProvider(null);
      resetForm();
      fetchProviders();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Toggle Key Status (e.g. from exhausted back to active)
  const handleResetKeyStatus = async (providerId: string, keyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "exhausted" : "active";
    try {
      const res = await adminFetch(`/api/admin/providers/${providerId}/keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchProviders();
      }
    } catch (err) {
      console.error("Toggle key status failed", err);
    }
  };

  // Confirm Delete Provider
  const handleConfirmDeleteProvider = async () => {
    if (!deletingProvider) return;
    setFormSubmitLoading(true);
    try {
      const res = await adminFetch(`/api/admin/providers/${deletingProvider.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingProvider(null);
        if (selectedAnalyticsProviderId === deletingProvider.id) {
          setSelectedAnalyticsProviderId(null);
        }
        fetchProviders();
        fetchUsage();
      }
    } catch (err) {
      console.error("Delete provider failed", err);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Confirm Delete Key
  const handleConfirmDeleteKey = async () => {
    if (!deletingKey) return;
    setFormSubmitLoading(true);
    try {
      const res = await adminFetch(`/api/admin/providers/${deletingKey.providerId}/keys/${deletingKey.key.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingKey(null);
        fetchProviders();
      }
    } catch (err) {
      console.error("Delete key failed", err);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormType("openai");
    setFormBaseUrl("");
    setFormModels("");
    setFormApiKey("");
    setFormKeyLabel("");
    setFormError(null);
  };

  const openEditModal = (p: ProviderData) => {
    setEditingProvider(p);
    setFormName(p.name);
    setFormType(p.type);
    setFormBaseUrl(p.baseUrl || "");
    setFormModels(p.models || "");
    setFormError(null);
  };

  const openAddKeyModal = (p: ProviderData) => {
    setAddingKeyProvider(p);
    setFormKeyLabel(`کلید ${p.apiKeys.length + 1}`);
    setFormApiKey("");
    setFormError(null);
  };

  // Max tokens for comparison chart calculation
  const maxProviderTokens = Math.max(1, ...providerStats.map((p) => p.tokens));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8" dir="rtl">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Server className="size-5 text-white" />
            <h2 className="text-lg font-bold text-white">مدیریت پروایدرهای متمرکز سیستم</h2>
          </div>
          <p className="mt-1 text-xs text-foreground-3">
            پیکربندی هوش مصنوعی‌های پیش‌فرض سایت با قابلیت جابجایی خودکار کلیدها (Auto-Failover) در صورت اتمام موجودی.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddProviderOpen(true);
            }}
            className="gap-2 bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-9"
          >
            <Plus className="size-4" />
            <span>افزودن پروایدر جدید</span>
          </Button>
        </div>
      </div>

      {/* Failover Protocol Info Card */}
      <div className="rounded-card border border-white/10 bg-[#0f0f11] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 grid place-items-center shrink-0">
            <Zap className="size-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white">سیستم هوشمند چندکلیدی و چرخش بار (Multi-Key Failover)</h4>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 text-[10px] text-emerald-300 font-medium">
                فعال و محافظت‌شده
              </span>
            </div>
            <p className="text-[11px] text-foreground-3 mt-0.5 leading-relaxed">
              هر پروایدر می‌تواند چندین کلید فعال داشته باشد. سامانه بر اساس الگوریتم کمترین استفاده (Least-Used) کلیدها را انتخاب می‌کند؛ در صورت دریافت خطای محدودیت نرخ یا اتمام سهمیه (429 Quota Exceeded)، کلید جاری به عنوان «پایان سهمیه» علامت‌گذاری شده و فوراً بدون اختلال به کلید بعدی سوئیچ می‌گردد.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Providers List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-foreground-2" />
            <h3 className="text-sm font-bold text-white">پروایدرهای تعریف‌شده ({providers.length})</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchProviders}
            className="text-xs text-foreground-3 hover:text-white h-7 gap-1.5"
          >
            <RefreshCw className={cn("size-3", loading && "animate-spin")} />
            <span>بازخوانی</span>
          </Button>
        </div>

        {error && (
          <div className="rounded-control border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {providers.length === 0 && !loading && (
          <div className="rounded-card border border-dashed border-line bg-card/40 p-8 text-center">
            <Server className="mx-auto size-8 text-foreground-3 mb-2" />
            <p className="text-xs text-foreground-2 font-medium">هیچ پروایدری تاکنون تعریف نشده است.</p>
            <p className="text-[11px] text-foreground-3 mt-1">
              جهت فعال‌سازی قابلیت‌های چت چندمدلی، اولین پروایدر سیستم را اضافه کنید.
            </p>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsAddProviderOpen(true);
              }}
              className="mt-4 gap-1.5 text-xs bg-white text-black hover:bg-neutral-200"
            >
              <Plus className="size-3.5" />
              <span>ایجاد اولین پروایدر</span>
            </Button>
          </div>
        )}

        {/* Providers Cards Grid */}
        <div className="grid grid-cols-1 gap-4">
          {providers.map((p) => {
            const activeKeysCount = p.apiKeys.filter((k) => k.status === "active").length;
            const exhaustedKeysCount = p.apiKeys.filter((k) => k.status === "exhausted").length;
            const errorKeysCount = p.apiKeys.filter((k) => k.status === "error").length;
            const isExpanded = expandedProviderId === p.id;
            const modelList = p.models.split(",").map((m) => m.trim()).filter(Boolean);

            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-card border transition-colors bg-[#111113]",
                  p.isActive ? "border-line hover:border-white/20" : "border-line/40 opacity-75",
                )}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border-b border-line/50">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "size-10 rounded-xl border grid place-items-center shrink-0 font-bold text-xs uppercase",
                        p.isActive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-line bg-soft text-foreground-3",
                      )}
                    >
                      {p.type.slice(0, 3)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{p.name}</h4>
                        <span className="font-mono text-[10px] text-foreground-3 uppercase rounded bg-soft border border-line px-1.5 py-0.5">
                          {p.type}
                        </span>
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            فعال در چت
                          </span>
                        ) : (
                          <span className="rounded-full bg-neutral-800 border border-line px-2 py-0.5 text-[10px] text-foreground-3">
                            غیرفعال (پنهان از کاربران)
                          </span>
                        )}
                      </div>

                      {/* Models List */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[11px] text-foreground-3">مدل‌های قابل انتخاب:</span>
                        {modelList.map((m) => (
                          <span
                            key={m}
                            dir="ltr"
                            className="font-mono text-[10.5px] rounded bg-white/5 border border-line px-1.5 py-0.5 text-foreground-2"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Toggles */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.isActive}
                      onClick={() => handleToggleActive(p)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                        p.isActive ? "bg-emerald-500" : "bg-neutral-800",
                      )}
                      title={p.isActive ? "کلیک برای غیرفعال‌سازی" : "کلیک برای فعال‌سازی"}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          p.isActive ? "translate-x-0" : "-translate-x-5",
                        )}
                      />
                    </button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedProviderId(isExpanded ? null : p.id)}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Key className="size-3.5" />
                      <span>کلیدها ({p.apiKeys.length})</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(p)}
                      className="text-xs h-8 text-foreground-2 hover:text-white"
                    >
                      ویرایش
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingProvider(p)}
                      className="text-xs h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sub-bar: Keys Summary & Health */}
                <div className="flex items-center justify-between px-4 py-2 bg-black/40 text-[11px] text-foreground-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span>فعال: {activeKeysCount}</span>
                    </span>
                    {exhaustedKeysCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <span className="size-1.5 rounded-full bg-amber-400" />
                        <span>پایان سهمیه: {exhaustedKeysCount}</span>
                      </span>
                    )}
                    {errorKeysCount > 0 && (
                      <span className="flex items-center gap-1 text-red-400 font-medium">
                        <span className="size-1.5 rounded-full bg-red-400" />
                        <span>خطادار: {errorKeysCount}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedProviderId(isExpanded ? null : p.id)}
                    className="hover:text-white transition-colors text-[11px]"
                  >
                    {isExpanded ? "بستن لیست کلیدها ▲" : "مشاهده و مدیریت جزئیات کلیدها ▼"}
                  </button>
                </div>

                {/* Expandable Keys List */}
                {isExpanded && (
                  <div className="p-4 bg-black/25 border-t border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Key className="size-3.5 text-foreground-3" />
                        <span>کلیدهای API ثبت‌شده برای این پروایدر</span>
                      </h5>
                      <Button
                        size="sm"
                        onClick={() => openAddKeyModal(p)}
                        className="text-xs h-7 gap-1 bg-white text-black hover:bg-neutral-200"
                      >
                        <Plus className="size-3" />
                        <span>افزودن کلید جدید</span>
                      </Button>
                    </div>

                    {p.apiKeys.length === 0 ? (
                      <div className="rounded-control border border-dashed border-line p-4 text-center text-xs text-foreground-3">
                        هنوز کلیدی برای این پروایدر ثبت نشده است. لطفاً حداقل یک کلید اضافه کنید.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {p.apiKeys.map((k) => (
                          <div
                            key={k.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-control border border-line bg-[#141416] p-3 text-xs gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "size-2 rounded-full shrink-0",
                                  k.status === "active" && "bg-emerald-400",
                                  k.status === "exhausted" && "bg-amber-400",
                                  k.status === "error" && "bg-red-400",
                                )}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{k.label}</span>
                                  <span
                                    dir="ltr"
                                    className="font-mono text-[11px] text-foreground-2 bg-black/50 border border-line px-1.5 py-0.5 rounded"
                                  >
                                    {k.keyMask}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-[10px] rounded px-1.5 py-0.2 border",
                                      k.status === "active" &&
                                        "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
                                      k.status === "exhausted" &&
                                        "bg-amber-500/10 border-amber-500/20 text-amber-300",
                                      k.status === "error" &&
                                        "bg-red-500/10 border-red-500/20 text-red-300",
                                    )}
                                  >
                                    {k.status === "active"
                                      ? "فعال در کلاستر"
                                      : k.status === "exhausted"
                                        ? "پایان سهمیه (Failover)"
                                        : "خطای اعتبارسنجی"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[10.5px] text-foreground-3 mt-1">
                                  <span>درخواست‌های پردازش‌شده: {k.usageCount.toLocaleString("fa-IR")}</span>
                                  {k.lastUsedAt && (
                                    <span>
                                      آخرین استفاده: {new Date(k.lastUsedAt).toLocaleDateString("fa-IR")}
                                    </span>
                                  )}
                                  {k.lastErrorMessage && (
                                    <span className="text-red-400 truncate max-w-xs" title={k.lastErrorMessage}>
                                      خطا: {k.lastErrorMessage}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {k.status !== "active" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResetKeyStatus(p.id, k.id, k.status)}
                                  className="text-[11px] h-7 text-emerald-400 hover:text-emerald-300 border-emerald-500/30"
                                >
                                  فعال‌سازی مجدد
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingKey({ providerId: p.id, key: k })}
                                className="text-xs h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Usage Analytics & Charts */}
      <div className="space-y-6 pt-4 border-t border-line">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="size-4 text-white" />
              <h3 className="text-sm font-bold text-white">تحلیل و آمار مصرف توکن‌ها (Site-wide Usage Analytics)</h3>
              {analyticsLoading && <RefreshCw className="size-3 animate-spin text-foreground-3" />}
            </div>
            <p className="text-xs text-foreground-3 mt-0.5">
              نمودار مقایسه‌ای پروایدرها، پرمصرف‌ترین مدل و کاربران اختصاصی هر سرویس‌دهنده
            </p>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 rounded-control border border-line bg-card p-1">
            <button
              type="button"
              onClick={() => setAnalyticsPeriod("day")}
              className={cn(
                "rounded-control px-2.5 py-1 text-xs font-medium transition-colors",
                analyticsPeriod === "day" ? "bg-white text-black" : "text-foreground-3 hover:text-white",
              )}
            >
              ۲۴ ساعت اخیر
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsPeriod("week")}
              className={cn(
                "rounded-control px-2.5 py-1 text-xs font-medium transition-colors",
                analyticsPeriod === "week" ? "bg-white text-black" : "text-foreground-3 hover:text-white",
              )}
            >
              ۷ روز گذشته
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsPeriod("month")}
              className={cn(
                "rounded-control px-2.5 py-1 text-xs font-medium transition-colors",
                analyticsPeriod === "month" ? "bg-white text-black" : "text-foreground-3 hover:text-white",
              )}
            >
              ۳۰ روز گذشته
            </button>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-card border border-line bg-[#111113] p-4">
            <div className="flex items-center justify-between text-foreground-3">
              <span className="text-xs">کل توکن‌های مصرف‌شده</span>
              <Cpu className="size-4 text-neutral-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-white">
                {(usageSummary?.totalTokens || 0).toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-foreground-3">توکن</span>
            </div>
            <p className="mt-1 text-[11px] text-foreground-3">
              ورودی: {(usageSummary?.totalPromptTokens || 0).toLocaleString("fa-IR")} | خروجی: {(usageSummary?.totalCompletionTokens || 0).toLocaleString("fa-IR")}
            </p>
          </div>

          <div className="rounded-card border border-line bg-[#111113] p-4">
            <div className="flex items-center justify-between text-foreground-3">
              <span className="text-xs">تعداد کل درخواست‌ها</span>
              <TrendingUp className="size-4 text-neutral-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-white">
                {(usageSummary?.totalRequests || 0).toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-foreground-3">درخواست</span>
            </div>
            <p className="mt-1 text-[11px] text-foreground-3">در بازه زمانی انتخابی</p>
          </div>

          <div className="rounded-card border border-line bg-[#111113] p-4">
            <div className="flex items-center justify-between text-foreground-3">
              <span className="text-xs">پرمصرف‌ترین پروایدر</span>
              <Server className="size-4 text-neutral-400" />
            </div>
            <div className="mt-3">
              <span className="text-base font-bold text-white truncate block">
                {usageSummary?.topProvider?.name || "بدون داده"}
              </span>
              <p className="text-[11px] text-foreground-3 mt-1 font-mono">
                {usageSummary?.topProvider ? `${usageSummary.topProvider.tokens.toLocaleString("fa-IR")} توکن` : "-"}
              </p>
            </div>
          </div>

          <div className="rounded-card border border-line bg-[#111113] p-4">
            <div className="flex items-center justify-between text-foreground-3">
              <span className="text-xs">محبوب‌ترین مدل هوش مصنوعی</span>
              <Zap className="size-4 text-neutral-400" />
            </div>
            <div className="mt-3">
              <span dir="ltr" className="font-mono text-base font-bold text-white truncate block text-right">
                {usageSummary?.topModel?.model || "بدون داده"}
              </span>
              <p className="text-[11px] text-foreground-3 mt-1 font-mono">
                {usageSummary?.topModel ? `${usageSummary.topModel.tokens.toLocaleString("fa-IR")} توکن` : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Bar Chart and Top Users Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Per-Provider Token Comparison Chart */}
          <div className="rounded-card border border-line bg-[#111113] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">مقایسه مصرف پروایدرها</h4>
                <p className="text-[11px] text-foreground-3 mt-0.5">
                  برای مشاهده کاربران اختصاصی، روی نام پروایدر کلیک کنید
                </p>
              </div>
              {selectedAnalyticsProviderId && (
                <button
                  type="button"
                  onClick={() => setSelectedAnalyticsProviderId(null)}
                  className="text-[11px] text-amber-400 hover:text-amber-300"
                >
                  نمایش همگانی ✕
                </button>
              )}
            </div>

            {providerStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-foreground-3">
                داده‌ای در این بازه زمانی برای پروایدرها ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {providerStats.map((stat) => {
                  const percentage = Math.round((stat.tokens / maxProviderTokens) * 100);
                  const isSelected = selectedAnalyticsProviderId === stat.providerId;

                  return (
                    <div
                      key={stat.providerId}
                      onClick={() =>
                        setSelectedAnalyticsProviderId(
                          isSelected ? null : stat.providerId,
                        )
                      }
                      className={cn(
                        "rounded-control p-2.5 border transition-all cursor-pointer",
                        isSelected
                          ? "border-white bg-white/10"
                          : "border-transparent bg-soft/50 hover:border-line hover:bg-soft",
                      )}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{stat.name}</span>
                          <span className="text-[10px] text-foreground-3 uppercase font-mono">
                            ({stat.type})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-foreground-2">{stat.tokens.toLocaleString("fa-IR")} توکن</span>
                          <span className="text-foreground-3 text-[10px]">
                            ({stat.requests.toLocaleString("fa-IR")} بار)
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${Math.max(4, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Top Users for Selected Provider / Site-wide */}
          <div className="rounded-card border border-line bg-[#111113] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserIcon className="size-3.5 text-foreground-3" />
                  <span>
                    {selectedAnalyticsProviderId
                      ? `کاربران برتر پروایدر ${providerStats.find((p) => p.providerId === selectedAnalyticsProviderId)?.name || ""}`
                      : "کاربران با بیشترین مصرف در کل سایت"}
                  </span>
                </h4>
                <p className="text-[11px] text-foreground-3 mt-0.5">
                  مرتب‌شده بر اساس بیشترین توکن‌های مصرفی
                </p>
              </div>
            </div>

            {topUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-foreground-3">
                داده‌ای از مصرف کاربران در این بازه ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u, idx) => (
                  <div
                    key={u.userId}
                    className="flex items-center justify-between rounded-control border border-line/60 bg-black/30 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-foreground-3 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-white block">{u.name}</span>
                        <span dir="ltr" className="text-[10.5px] text-foreground-3 block font-mono">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-white font-semibold text-xs">
                        {u.tokens.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-[10px] text-foreground-3 block">
                        {u.requests.toLocaleString("fa-IR")} درخواست
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modal 1: Add New Provider */}
      {/* ========================================================================= */}
      {isAddProviderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-card border border-line bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="size-4" />
                <span>افزودن پروایدر هوش مصنوعی جدید</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProviderOpen(false)}
                className="text-foreground-3 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-control border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProvider} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground-2 mb-1">نام نمایشی پروایدر (در ModelPicker)</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: OpenAI Enterprise یا کلاستر اختصاصی آرکا"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground-2 mb-1">نوع پروایدر</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full h-9 rounded-control border border-line bg-card px-2 text-xs text-foreground focus:border-white focus:outline-none"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="custom">سفارشی (Custom API)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground-2 mb-1">Base URL (اختیاری)</label>
                  <Input
                    value={formBaseUrl}
                    onChange={(e) => setFormBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    dir="ltr"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground-2 mb-1">
                  مدل‌های در دسترس (با کاما جدا کنید)
                </label>
                <Input
                  value={formModels}
                  onChange={(e) => setFormModels(e.target.value)}
                  placeholder="gpt-4o, gpt-4o-mini, o1"
                  dir="ltr"
                  required
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10.5px] text-foreground-3 mt-1 block">
                  این مدل‌ها مستقیماً در لیست مدل‌های قابل انتخاب کاربران نمایش داده خواهند شد.
                </span>
              </div>

              {/* Initial API Key */}
              <div className="border-t border-line pt-3 space-y-3">
                <h5 className="font-bold text-white text-xs">کلید اولیه پروایدر (اختیاری اما توصیه شده)</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Input
                      value={formKeyLabel}
                      onChange={(e) => setFormKeyLabel(e.target.value)}
                      placeholder="برچسب (مثلاً کلید اصلی)"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="password"
                      value={formApiKey}
                      onChange={(e) => setFormApiKey(e.target.value)}
                      placeholder="sk-••••••••••••••••"
                      dir="ltr"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddProviderOpen(false)}
                  className="h-9 text-xs"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="h-9 text-xs bg-white text-black hover:bg-neutral-200"
                >
                  {formSubmitLoading ? "در حال ایجاد..." : "ثبت و فعال‌سازی"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 2: Edit Provider */}
      {/* ========================================================================= */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-card border border-line bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-white">ویرایش مشخصات پروایدر</h3>
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="text-foreground-3 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-control border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateProvider} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground-2 mb-1">نام نمایشی پروایدر</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground-2 mb-1">نوع پروایدر</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full h-9 rounded-control border border-line bg-card px-2 text-xs text-foreground focus:border-white focus:outline-none"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="custom">سفارشی (Custom API)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground-2 mb-1">Base URL (اختیاری)</label>
                  <Input
                    value={formBaseUrl}
                    onChange={(e) => setFormBaseUrl(e.target.value)}
                    dir="ltr"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground-2 mb-1">
                  مدل‌های در دسترس (با کاما جدا کنید)
                </label>
                <Input
                  value={formModels}
                  onChange={(e) => setFormModels(e.target.value)}
                  dir="ltr"
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProvider(null)}
                  className="h-9 text-xs"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="h-9 text-xs bg-white text-black hover:bg-neutral-200"
                >
                  {formSubmitLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 3: Add Key to Provider */}
      {/* ========================================================================= */}
      {addingKeyProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-card border border-line bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="size-4" />
                <span>افزودن کلید جدید به {addingKeyProvider.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAddingKeyProvider(null)}
                className="text-foreground-3 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-control border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddKey} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground-2 mb-1">برچسب کلید</label>
                <Input
                  value={formKeyLabel}
                  onChange={(e) => setFormKeyLabel(e.target.value)}
                  placeholder="مثلاً: کلید شماره ۲ یا رزرو پشتیبان"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground-2 mb-1">کلید API</label>
                <Input
                  type="password"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  placeholder="sk-••••••••••••••••••••••••"
                  dir="ltr"
                  required
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10.5px] text-foreground-3 mt-1 block">
                  کلید با الگوریتم AES-256 رمزنگاری شده و به صورت امن ذخیره می‌گردد.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddingKeyProvider(null)}
                  className="h-9 text-xs"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="h-9 text-xs bg-white text-black hover:bg-neutral-200"
                >
                  {formSubmitLoading ? "در حال ثبت..." : "افزودن کلید به کلاستر"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 4: Delete Provider Confirmation */}
      {/* ========================================================================= */}
      {deletingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-card border border-red-500/30 bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl border border-red-500/30 bg-red-500/10 grid place-items-center shrink-0">
                <AlertTriangle className="size-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">تأیید حذف پروایدر «{deletingProvider.name}»</h3>
                <p className="mt-2 text-xs text-foreground-3 leading-relaxed">
                  آیا از حذف این پروایدر مطمئن هستید؟ با حذف آن، تمام <strong className="text-white">{deletingProvider.apiKeys.length} کلید API</strong> و سوابق مصرف متصل به آن حذف خواهند شد و این مدل‌ها دیگر در پنل کاربری نمایش داده نخواهند شد.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={formSubmitLoading}
                onClick={() => setDeletingProvider(null)}
                className="h-9 text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={formSubmitLoading}
                onClick={handleConfirmDeleteProvider}
                className="h-9 text-xs bg-red-600 text-white hover:bg-red-700"
              >
                {formSubmitLoading ? "در حال حذف..." : "بله، حذف قطعی پروایدر"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 5: Delete Key Confirmation */}
      {/* ========================================================================= */}
      {deletingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-card border border-red-500/30 bg-[#141416] p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white">حذف کلید API</h3>
            <p className="mt-2 text-xs text-foreground-3">
              آیا از حذف کلید «<span className="text-white font-medium">{deletingKey.key.label}</span>» ({deletingKey.key.keyMask}) اطمینان دارید؟
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={formSubmitLoading}
                onClick={() => setDeletingKey(null)}
                className="h-8 text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={formSubmitLoading}
                onClick={handleConfirmDeleteKey}
                className="h-8 text-xs bg-red-600 text-white hover:bg-red-700"
              >
                {formSubmitLoading ? "در حال حذف..." : "حذف کلید"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
