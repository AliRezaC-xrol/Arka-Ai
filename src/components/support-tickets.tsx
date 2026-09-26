"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Support tickets — the user side: open a ticket, see past tickets and their
 * status, and follow the conversation.
 */

import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MessageSquarePlus,
  Send,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface TicketRow {
  id: string;
  subject: string;
  status: "open" | "answered" | "closed" | string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  _count?: { messages: number };
}

interface TicketMessageRow {
  id: string;
  isAdmin: boolean;
  body: string;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
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
    className: "border-line bg-soft text-foreground-3",
    Icon: Lock,
  },
};

function StatusBadge({ status }: { status: string }) {
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

export function SupportTickets({
  open,
  onClose,
  onUnreadChange,
}: {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}) {
  const [mode, setMode] = React.useState<"list" | "new" | "thread">("list");
  const [tickets, setTickets] = React.useState<TicketRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ ok: boolean; text: string } | null>(null);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [thread, setThread] = React.useState<{ ticket: TicketRow; messages: TicketMessageRow[] } | null>(null);
  const [reply, setReply] = React.useState("");

  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [priority, setPriority] = React.useState("normal");

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json().catch(() => ({}));
      const list: TicketRow[] = data.tickets || [];
      setTickets(list);
      onUnreadChange?.(list.filter((t) => t.status === "answered").length);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  const loadThread = React.useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json().catch(() => ({}));
      if (data.ticket) {
        setThread({ ticket: data.ticket, messages: data.ticket.messages || [] });
        setMode("thread");
      }
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setMode("list");
      setFeedback(null);
      setActiveId(null);
      setThread(null);
      loadTickets();
    }
  }, [open, loadTickets]);

  const createTicket = async () => {
    if (!subject.trim() || !body.trim()) {
      setFeedback({ ok: false, text: "موضوع و متن پیام هر دو الزامی هستند." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: body.trim(), priority }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ثبت تیکت ناموفق بود.");

      setSubject("");
      setBody("");
      setPriority("normal");
      setFeedback({ ok: true, text: "تیکت شما ثبت شد. پاسخ پشتیبانی همینجا نمایش داده میشود." });
      await loadTickets();
      if (data.ticket?.id) {
        setActiveId(data.ticket.id);
        await loadThread(data.ticket.id);
      } else {
        setMode("list");
      }
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error)?.message || "خطای نامشخص." });
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ارسال پاسخ ناموفق بود.");
      setReply("");
      await loadThread(activeId);
      await loadTickets();
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error)?.message || "خطای نامشخص." });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#101013] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2.5">
            {mode !== "list" && (
              <button
                type="button"
                onClick={() => {
                  setMode("list");
                  setFeedback(null);
                  loadTickets();
                }}
                className="grid size-7 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                title="بازگشت"
              >
                <ArrowRight className="size-4" />
              </button>
            )}
            <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
              <MessageSquarePlus className="size-4 text-sky-400" />
            </span>
            <div>
              <h2 className="text-[14.5px] font-bold text-white">
                {mode === "new" ? "تیکت جدید" : mode === "thread" ? thread?.ticket.subject : "پشتیبانی"}
              </h2>
              <p className="text-[11.5px] text-neutral-400">
                {mode === "thread"
                  ? "گفتگوی شما با تیم پشتیبانی ارکا"
                  : "سؤالت را بپرس؛ تیم پشتیبانی پاسخ میدهد."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {feedback && (
          <div
            className={cn(
              "mx-5 mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] leading-6",
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

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {mode === "list" && (
            <div className="space-y-3">
              {loading && tickets.length === 0 && (
                <div className="flex items-center justify-center py-10 text-neutral-500">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              )}

              {!loading && tickets.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
                  <MessageSquarePlus className="mx-auto size-7 text-neutral-600" />
                  <p className="mt-3 text-[13px] text-neutral-400">هنوز تیکتی ثبت نکردهاید.</p>
                  <p className="mt-1 text-[11.5px] text-neutral-500">
                    اگر سؤالی دارید یا مشکلی پیش آمده، یک تیکت باز کنید.
                  </p>
                </div>
              )}

              {tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveId(t.id);
                    loadThread(t.id);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-start transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-white">{t.subject}</p>
                    <p className="mt-1 font-mono text-[10.5px] text-neutral-500">
                      {new Date(t.updatedAt).toLocaleString("fa-IR")}
                      {t._count ? ` · ${t._count.messages} پیام` : ""}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </button>
              ))}
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-300">موضوع</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلاً: مدل گوگل وصل نمیشود"
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#151518] px-3 text-[13px] text-white placeholder:text-neutral-600 outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-300">اولویت</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#151518] px-3 text-[13px] text-white outline-none focus:border-white/30"
                >
                  <option value="low">کم</option>
                  <option value="normal">معمولی</option>
                  <option value="high">فوری</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-300">توضیحات</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="مشکل را کامل توضیح دهید…"
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#151518] p-3 text-[13px] leading-6 text-white placeholder:text-neutral-600 outline-none focus:border-white/30"
                />
              </div>

              <button
                type="button"
                onClick={createTicket}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                ثبت تیکت
              </button>
            </div>
          )}

          {mode === "thread" && thread && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={thread.ticket.status} />
                {thread.ticket.closedAt && (
                  <span className="font-mono text-[10.5px] text-neutral-500">
                    بستهشده در {new Date(thread.ticket.closedAt).toLocaleDateString("fa-IR")}
                  </span>
                )}
              </div>

              {thread.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-2xl border px-3.5 py-2.5",
                    m.isAdmin
                      ? "border-sky-500/25 bg-sky-500/[0.06]"
                      : "border-white/[0.08] bg-white/[0.02]",
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-bold text-white">
                      {m.isAdmin ? "پشتیبانی ارکا" : "شما"}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {new Date(m.createdAt).toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-[12.5px] leading-6 text-neutral-300">{m.body}</p>
                </div>
              ))}

              {thread.ticket.status === "closed" ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[12px] text-neutral-400">
                  این تیکت بسته شده است. اگر هنوز مشکلی دارید، تیکت جدیدی باز کنید.
                </p>
              ) : (
                <div className="flex items-end gap-2 pt-1">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={2}
                    placeholder="پاسخ خود را بنویسید…"
                    className="min-h-10 flex-1 resize-y rounded-xl border border-white/10 bg-[#151518] p-2.5 text-[13px] leading-6 text-white placeholder:text-neutral-600 outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={busy || !reply.trim()}
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-black transition-colors hover:bg-neutral-200 disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "list" && (
          <div className="border-t border-white/[0.07] px-5 py-3.5">
            <button
              type="button"
              onClick={() => {
                setMode("new");
                setFeedback(null);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-[12.5px] font-bold text-black transition-colors hover:bg-neutral-200"
            >
              <MessageSquarePlus className="size-3.5" />
              تیکت جدید
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
