"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Admin — the support ticket inbox: triage the queue, read a thread, reply,
 * and change a ticket's status (open / answered / closed).
 */

import { adminFetch } from "@/lib/admin-fetch";

import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Lock,
  LockOpen,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "answered" | "closed";

interface AdminTicketRow {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  _count: { messages: number };
  messages: Array<{ body: string; createdAt: string; isAdmin: boolean }>;
}

interface AdminTicketMessage {
  id: string;
  isAdmin: boolean;
  body: string;
  createdAt: string;
}

interface AdminTicketThread {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  messages: AdminTicketMessage[];
}

const STATUS_META: Record<TicketStatus, { label: string; className: string; Icon: typeof Clock }> = {
  open: {
    label: "در انتظار بررسی",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    Icon: Clock,
  },
  answered: {
    label: "پاسخ داده شده",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    Icon: CheckCircle2,
  },
  closed: {
    label: "بسته شده",
    className: "border-white/10 bg-white/[0.04] text-neutral-400",
    Icon: Lock,
  },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: { label: "کم", className: "border-white/10 bg-white/[0.04] text-neutral-400" },
  normal: { label: "معمولی", className: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  high: { label: "فوری", className: "border-red-500/30 bg-red-500/10 text-red-300" },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.open;
  const { Icon } = meta;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
        meta.className,
      )}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}

function Avatar({ user }: { user: AdminTicketRow["user"] }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name || user.email}
        className="size-9 shrink-0 rounded-full border border-white/10 object-cover"
      />
    );
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-[12px] font-bold text-neutral-300">
      {(user.name || user.email || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function TicketsManager() {
  const [tickets, setTickets] = React.useState<AdminTicketRow[]>([]);
  const [counts, setCounts] = React.useState({ open: 0, answered: 0, closed: 0, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | TicketStatus>("all");
  const [search, setSearch] = React.useState("");

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [thread, setThread] = React.useState<AdminTicketThread | null>(null);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [reply, setReply] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ ok: boolean; text: string } | null>(null);

  const loadTickets = React.useCallback(async (status: "all" | TicketStatus, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const qs = status === "all" ? "" : `?status=${status}`;
      const res = await adminFetch(`/api/admin/tickets${qs}`);
      const data = await res.json().catch(() => ({}));
      setTickets(data.tickets || []);
      if (data.counts) setCounts(data.counts);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTickets(filter);
  }, [filter, loadTickets]);

  const loadThread = React.useCallback(async (id: string) => {
    setThreadLoading(true);
    setFeedback(null);
    try {
      const res = await adminFetch(`/api/admin/tickets/${id}`);
      const data = await res.json().catch(() => ({}));
      if (data.ticket) {
        setThread(data.ticket);
        setActiveId(id);
      } else {
        setFeedback({ ok: false, text: data.error || "تیکت پیدا نشد." });
      }
    } catch {
      setFeedback({ ok: false, text: "خطا در دریافت تیکت." });
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const refreshAll = async (keepOpenId?: string | null) => {
    await loadTickets(filter);
    const id = keepOpenId ?? activeId;
    if (id) await loadThread(id);
  };

  const sendReply = async () => {
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await adminFetch(`/api/admin/tickets/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ارسال پاسخ ناموفق بود.");
      setReply("");
      setFeedback({ ok: true, text: "پاسخ شما برای کاربر ارسال شد." });
      await refreshAll(activeId);
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error)?.message || "خطای نامشخص." });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: TicketStatus) => {
    if (!activeId) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await adminFetch(`/api/admin/tickets/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تغییر وضعیت ناموفق بود.");
      setFeedback({
        ok: true,
        text:
          status === "closed"
            ? "تیکت بسته شد."
            : status === "open"
              ? "تیکت دوباره در صف بررسی قرار گرفت."
              : "وضعیت تیکت به «پاسخ داده شده» تغییر کرد.",
      });
      await refreshAll(activeId);
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error)?.message || "خطای نامشخص." });
    } finally {
      setBusy(false);
    }
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        (t.user.name || "").toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q),
    );
  }, [tickets, search]);

  const FILTERS: Array<{ key: "all" | TicketStatus; label: string; count: number }> = [
    { key: "all", label: "همه", count: counts.total },
    { key: "open", label: "در انتظار بررسی", count: counts.open },
    { key: "answered", label: "پاسخ داده شده", count: counts.answered },
    { key: "closed", label: "بسته شده", count: counts.closed },
  ];

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Queue */}
      <div className="flex w-[360px] shrink-0 flex-col border-e border-white/5">
        <div className="space-y-3 border-b border-white/5 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[13px] font-bold text-white">
              <Inbox className="size-4 text-neutral-400" />
              صندوق تیکتهای پشتیبانی
            </h2>
            <button
              type="button"
              onClick={() => refreshAll()}
              title="بهروزرسانی"
              className="grid size-7 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === f.key
                    ? "border-white/30 bg-white text-black"
                    : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/25 hover:text-white",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    filter === f.key ? "text-black/60" : "text-neutral-500",
                  )}
                >
                  {f.count.toLocaleString("fa-IR")}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی موضوع یا کاربر…"
              className="h-9 rounded-xl border-white/10 bg-[#151518] pe-9 text-[12.5px] text-white placeholder:text-neutral-600"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loading && tickets.length === 0 && (
            <div className="flex items-center justify-center py-12 text-neutral-500">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="mx-2 rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center">
              <Inbox className="mx-auto size-6 text-neutral-600" />
              <p className="mt-3 text-[12.5px] text-neutral-400">تیکتی در این بخش نیست.</p>
            </div>
          )}

          {filtered.map((t) => {
            const isActive = t.id === activeId;
            const last = t.messages[0];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => loadThread(t.id)}
                className={cn(
                  "mb-2 flex w-full flex-col gap-2 rounded-2xl border p-3 text-start transition-all",
                  isActive
                    ? "border-white/25 bg-white/[0.07]"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">
                    {t.subject}
                  </span>
                  <StatusBadge status={t.status} />
                </div>

                <div className="flex items-center gap-2">
                  <Avatar user={t.user} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-medium text-neutral-300">
                      {t.user.name || t.user.email}
                    </p>
                    <p className="truncate font-mono text-[10px] text-neutral-500">
                      {new Date(t.updatedAt).toLocaleString("fa-IR")} · {t._count.messages} پیام
                    </p>
                  </div>
                  {PRIORITY_META[t.priority] && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] font-medium",
                        PRIORITY_META[t.priority].className,
                      )}
                    >
                      {PRIORITY_META[t.priority].label}
                    </span>
                  )}
                </div>

                {last && (
                  <p className="line-clamp-2 text-[11.5px] leading-5 text-neutral-500">
                    {last.isAdmin ? "پشتیبانی: " : ""}
                    {last.body}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!activeId && !threadLoading && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Inbox className="size-9 text-neutral-700" />
            <p className="mt-4 text-[13.5px] font-semibold text-neutral-300">
              یک تیکت را از فهرست انتخاب کنید
            </p>
            <p className="mt-1.5 max-w-sm text-[12px] leading-6 text-neutral-500">
              تیکتهای کاربران اینجا جمع میشوند. میتوانید پاسخ بدهید، وضعیت را تغییر دهید یا تیکت را ببندید.
            </p>
          </div>
        )}

        {threadLoading && (
          <div className="flex flex-1 items-center justify-center text-neutral-500">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {thread && !threadLoading && (
          <>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[14px] font-bold text-white">{thread.subject}</h3>
                  <StatusBadge status={thread.status} />
                  {PRIORITY_META[thread.priority] && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        PRIORITY_META[thread.priority].className,
                      )}
                    >
                      {PRIORITY_META[thread.priority].label}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[10.5px] text-neutral-500">
                  #{thread.id.slice(0, 8)} · {thread.user.name || thread.user.email} ·{" "}
                  {thread.user.email} · {new Date(thread.createdAt).toLocaleString("fa-IR")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {thread.status !== "answered" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setStatus("answered")}
                    className="h-8 gap-1.5 rounded-full border-white/10 text-[11.5px] text-neutral-300 hover:border-white/30 hover:text-white"
                  >
                    <CheckCircle2 className="size-3.5" />
                    پاسخ داده شده
                  </Button>
                )}
                {thread.status === "closed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setStatus("open")}
                    className="h-8 gap-1.5 rounded-full border-white/10 text-[11.5px] text-neutral-300 hover:border-white/30 hover:text-white"
                  >
                    <LockOpen className="size-3.5" />
                    بازگشایی تیکت
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setStatus("closed")}
                    className="h-8 gap-1.5 rounded-full border-red-500/25 text-[11.5px] text-red-400 hover:border-red-500/50 hover:text-red-300"
                  >
                    <Lock className="size-3.5" />
                    بستن تیکت
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(null);
                    setThread(null);
                    setFeedback(null);
                  }}
                  title="بستن گفتگو"
                  className="grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>

            {feedback && (
              <div
                className={cn(
                  "mx-6 mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] leading-6",
                  feedback.ok
                    ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200"
                    : "border-red-500/30 bg-red-500/[0.08] text-red-200",
                )}
              >
                {feedback.ok ? (
                  <CheckCircle2 className="mt-1 size-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="mt-1 size-3.5 shrink-0" />
                )}
                <span className="whitespace-pre-wrap">{feedback.text}</span>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {thread.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    m.isAdmin
                      ? "ms-8 border-sky-500/25 bg-sky-500/[0.06]"
                      : "me-8 border-white/[0.08] bg-white/[0.02]",
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[11.5px] font-bold text-white">
                      {m.isAdmin ? "پشتیبانی ارکا" : thread.user.name || thread.user.email}
                      {m.isAdmin && (
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-sky-300">
                          شما
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {new Date(m.createdAt).toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-[12.5px] leading-6 text-neutral-300">{m.body}</p>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-white/5 px-6 py-4">
              {thread.status === "closed" ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5">
                  <p className="text-[12px] text-neutral-400">
                    این تیکت بسته شده است. برای پاسخدادن، ابتدا آن را بازگشایی کنید.
                  </p>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => setStatus("open")}
                    className="h-8 gap-1.5 rounded-full bg-white text-[11.5px] font-bold text-black hover:bg-neutral-200"
                  >
                    <LockOpen className="size-3.5" />
                    بازگشایی
                  </Button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    rows={3}
                    placeholder="پاسخ خود را بنویسید… (Ctrl+Enter برای ارسال)"
                    className="min-h-[52px] flex-1 resize-y rounded-xl border border-white/10 bg-[#151518] p-3 text-[13px] leading-6 text-white placeholder:text-neutral-600 outline-none focus:border-white/30"
                  />
                  <Button
                    disabled={busy || !reply.trim()}
                    onClick={sendReply}
                    className="h-11 gap-2 rounded-xl bg-white px-5 text-[12.5px] font-bold text-black hover:bg-neutral-200 disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    ارسال پاسخ
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
