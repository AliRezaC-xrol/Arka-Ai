"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Cpu,
  Eye,
  EyeOff,
  Globe,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

import { ArkaMark } from "@/components/site-navbar";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProviderItem {
  id: string;
  name: string;
  providerType: "openai" | "anthropic" | "google" | "custom";
  baseUrl?: string | null;
  keyMask?: string | null;
  models?: string | null;
  status: "connected" | "disconnected" | "untested";
  lastTestedAt?: string | null;
  lastTestMessage?: string | null;
  createdAt: string;
}

const PROVIDER_OPTIONS = [
  { id: "openai", name: "OpenAI", defaultBaseUrl: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic", defaultBaseUrl: "https://api.anthropic.com/v1" },
  { id: "google", name: "Google Gemini", defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta" },
  { id: "custom", name: "سفارشی / سازگار با OpenAI", defaultBaseUrl: "https://api.deepseek.com/v1" },
];

export default function ProvidersSettingsPage() {
  const [user, setUser] = React.useState<{
    name?: string | null;
    email?: string;
    avatarUrl?: string | null;
  } | null>(null);

  const [providers, setProviders] = React.useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);

  // Form State
  const [formName, setFormName] = React.useState("");
  const [formType, setFormType] = React.useState("openai");
  const [formBaseUrl, setFormBaseUrl] = React.useState("");
  const [formApiKey, setFormApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [testOnSave, setTestOnSave] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Testing status map for individual cards
  const [testingId, setTestingId] = React.useState<string | null>(null);

  // Load User Session
  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Load Providers
  const loadProviders = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user-providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (err) {
      console.error("Failed to load providers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formApiKey.trim()) {
      setFormError("لطفاً نام پروایدر و کلید API را وارد کنید.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          providerType: formType,
          baseUrl: formBaseUrl.trim() || undefined,
          apiKey: formApiKey.trim(),
          testNow: testOnSave,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در ایجاد پروایدر");
      }

      // Reset and close
      setFormName("");
      setFormApiKey("");
      setFormBaseUrl("");
      setShowAddModal(false);
      loadProviders();
    } catch (err: unknown) {
      setFormError((err as Error).message || "خطا در ثبت پروایدر.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestProvider = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/user-providers/${id}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.provider) {
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? data.provider : p)),
        );
      }
    } catch (err) {
      console.error("Test failed:", err);
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف پروایدر شخصی «${name}» اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/user-providers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProviders((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-line bg-background/80 px-4 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-xs text-foreground-2 hover:bg-soft hover:text-white"
          >
            <ArrowRight className="size-4" />
            <span>بازگشت به چت</span>
          </Link>

          <div className="h-4 w-px bg-line" />

          <div className="flex items-center gap-2">
            <ArkaMark className="size-6 text-white" />
            <span dir="ltr" className="font-display text-[16px] font-bold tracking-tight text-white">
              ARKA
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-foreground-2">
              تنظیمات
            </span>
          </div>
        </div>

        <div className="w-44">
          <UserMenu
            name={user?.name || "کاربر ارکا"}
            subtitle={user?.email || "حساب گوگل"}
            avatarUrl={user?.avatarUrl}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">پروایدرهای شخصی (BYOK)</h1>
            <p className="mt-1.5 text-xs leading-6 text-foreground-3 sm:text-sm">
              کلیدهای API خود را اضافه کنید. کلیه کلیدها با الگوریتم <span dir="ltr" className="font-mono text-foreground-2">AES-256-GCM</span> رمزنگاری شده و مستقیماً در انتخاب‌گر مدل‌های چت در دسترس خواهند بود.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="inline-flex shrink-0 items-center gap-2 bg-white text-xs font-semibold text-black hover:bg-neutral-200"
          >
            <Plus className="size-4" />
            افزودن پروایدر جدید
          </Button>
        </div>

        {/* Security Banner */}
        <div className="my-6 flex items-start gap-3 rounded-card border border-line bg-card/50 p-4 text-xs leading-6 text-foreground-2">
          <Lock className="mt-0.5 size-4 shrink-0 text-foreground-3" />
          <div>
            <span className="font-semibold text-foreground">امنیت کامل و ذخیره‌سازی ایزوله:</span> کلیدهای API شما فقط برای حساب شخص شما قابل استفاده‌اند و در دیتابیس رمزنگاری می‌شوند. در رابط کاربری نیز تنها ۴ کاراکتر آخر نمایش داده خواهد شد.
          </div>
        </div>

        {/* Providers List */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-line border-t-white" />
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line p-12 text-center">
            <Cpu className="size-10 text-foreground-3" />
            <h3 className="mt-4 text-sm font-semibold">هنوز پروایدری اضافه نکرده‌اید</h3>
            <p className="mt-1 max-w-sm text-xs leading-6 text-foreground-3">
              با افزودن کلیدهای خود از OpenAI، Anthropic یا مدل‌های سفارشی، سقف مصرف خود را مستقل کنید.
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="mt-5 gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              افزودن اولین پروایدر
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {providers.map((item) => {
              const isTesting = testingId === item.id;
              const isConnected = item.status === "connected";
              const isDisconnected = item.status === "disconnected";

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-card border border-line bg-card p-5 transition-colors hover:border-white/20"
                >
                  <div>
                    {/* Header: Name, Provider Type & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">{item.name}</h3>
                          <span className="rounded border border-line bg-soft px-2 py-0.5 text-[11px] font-semibold text-foreground-2 uppercase">
                            {item.providerType}
                          </span>
                        </div>
                        {item.baseUrl && (
                          <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-foreground-3" dir="ltr">
                            <Globe className="size-3" />
                            <span className="truncate max-w-[200px]">{item.baseUrl}</span>
                          </div>
                        )}
                      </div>

                      {/* Status indicator badge */}
                      <div>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                            <Check className="size-3" />
                            متصل شد
                          </span>
                        )}
                        {isDisconnected && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                            <AlertCircle className="size-3" />
                            خطا در اتصال
                          </span>
                        )}
                        {item.status === "untested" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-soft px-2.5 py-0.5 text-[11px] text-foreground-3">
                            تست‌نشده
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key Mask & Models */}
                    <div className="mt-4 space-y-2 border-t border-line/60 pt-3 text-xs">
                      <div className="flex items-center justify-between text-foreground-3">
                        <span className="flex items-center gap-1.5">
                          <Key className="size-3.5" />
                          کلید رمزنگاری‌شده:
                        </span>
                        <span dir="ltr" className="font-mono text-foreground-2">
                          {item.keyMask || "••••••••"}
                        </span>
                      </div>

                      {item.models && (
                        <div className="flex items-center justify-between text-foreground-3">
                          <span className="flex items-center gap-1.5">
                            <Server className="size-3.5" />
                            مدل‌ها:
                          </span>
                          <span className="truncate max-w-[180px] text-foreground-2">
                            {item.models}
                          </span>
                        </div>
                      )}

                      {item.lastTestMessage && (
                        <p
                          className={cn(
                            "mt-2 rounded p-2 text-[11px] leading-5",
                            isConnected
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300",
                          )}
                        >
                          {item.lastTestMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTesting}
                      onClick={() => handleTestProvider(item.id)}
                      className="gap-1.5 text-xs"
                    >
                      <RefreshCw className={cn("size-3", isTesting && "animate-spin")} />
                      {isTesting ? "در حال تست..." : "تست مجدد اتصال"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProvider(item.id, item.name)}
                      className="rounded p-1.5 text-foreground-3 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      title="حذف این پروایدر"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-line bg-[#141414] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h2 className="text-base font-bold">افزودن پروایدر شخصی</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-foreground-3 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProvider} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground-2 mb-1.5">
                  نام نمایشی پروایدر
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: OpenAI شخصی یا DeepSeek کاری"
                  className="h-10 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground-2 mb-1.5">
                  نوع پروایدر
                </label>
                <select
                  value={formType}
                  onChange={(e) => {
                    setFormType(e.target.value);
                    const opt = PROVIDER_OPTIONS.find((o) => o.id === e.target.value);
                    if (opt && e.target.value === "custom") {
                      setFormBaseUrl(opt.defaultBaseUrl);
                    } else {
                      setFormBaseUrl("");
                    }
                  }}
                  className="h-10 w-full rounded-control border border-line bg-background px-3 text-xs text-foreground focus:border-white focus:outline-none"
                >
                  {PROVIDER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {(formType === "custom" || formBaseUrl) && (
                <div>
                  <label className="block text-xs font-medium text-foreground-2 mb-1.5">
                    آدرس Base URL
                  </label>
                  <Input
                    value={formBaseUrl}
                    onChange={(e) => setFormBaseUrl(e.target.value)}
                    placeholder="https://api.your-provider.com/v1"
                    dir="ltr"
                    className="h-10 font-mono text-xs"
                    required={formType === "custom"}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-foreground-2 mb-1.5">
                  کلید API (API Key)
                </label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="sk-... یا کلید از پنل هوش مصنوعی"
                    dir="ltr"
                    className="h-10 pe-9 font-mono text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-foreground-3 hover:text-white"
                  >
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-foreground-3">
                  کلید با AES-256-GCM رمزنگاری شده و هرگز به‌صورت خام نگهداری نمی‌شود.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="testOnSave"
                  type="checkbox"
                  checked={testOnSave}
                  onChange={(e) => setTestOnSave(e.target.checked)}
                  className="rounded border-line bg-background accent-white"
                />
                <label htmlFor="testOnSave" className="text-xs text-foreground-2 cursor-pointer">
                  تست اتصال بلافاصله پس از ذخیره
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                >
                  {isSubmitting ? "در حال ثبت و تست..." : "ذخیره پروایدر"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
