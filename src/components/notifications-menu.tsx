"use client";

import * as React from "react";
import { Bell, CheckCheck, Mail, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UserNotification {
  id: string;
  adminMessageId: string;
  title: string | null;
  content: string;
  sentAt: string;
  sentToAll: boolean;
  isRead: boolean;
  readAt: string | null;
}

export function NotificationsMenu() {
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<UserNotification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside listener
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Mark single as read
  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      fetchNotifications();
    } catch (err) {
      console.error("Mark read error", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setLoading(true);
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
    );
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block" dir="rtl">
      {/* Bell Trigger Button */}
      <button
        type="button"
        aria-label="اعلان‌ها"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative grid size-9 place-items-center rounded-control border border-line bg-card text-foreground-2 transition-colors duration-200",
          "hover:border-white/30 hover:bg-soft hover:text-white",
          open && "border-white/40 bg-soft text-white",
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? "+9" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute start-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-card border border-line bg-[#141416] p-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-white" />
              <h3 className="text-xs font-bold text-white">پیام‌های مدیریت سیستم</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500/10 border border-red-500/30 px-1.5 py-0.2 text-[10px] text-red-400 font-mono">
                  {unreadCount} جدید
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={markAllAsRead}
                  className="h-7 text-[10.5px] text-foreground-3 hover:text-white gap-1"
                >
                  <CheckCheck className="size-3" />
                  <span>خواندن همه</span>
                </Button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground-3 hover:text-white p-1"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pe-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-foreground-3 space-y-2">
                <Sparkles className="size-6 text-foreground-3/50 mx-auto" />
                <p>هیچ پیامی برای شما ثبت نشده است.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.isRead) markAsRead(item.id);
                  }}
                  className={cn(
                    "rounded-control border p-3 text-xs transition-colors cursor-pointer text-start",
                    item.isRead
                      ? "border-line/40 bg-black/20 opacity-80"
                      : "border-emerald-500/30 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {!item.isRead && (
                        <span className="size-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                      )}
                      <span>{item.title || "پیام مدیریت آرکا"}</span>
                    </span>

                    <span className="font-mono text-[10px] text-foreground-3 shrink-0">
                      {new Date(item.sentAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>

                  <p className="text-foreground-2 leading-relaxed whitespace-pre-wrap text-[11.5px]">
                    {item.content}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-foreground-3 border-t border-line/30 pt-1.5">
                    <span>
                      {new Date(item.sentAt).toLocaleTimeString("fa-IR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {item.isRead ? (
                      <span className="text-foreground-3">خوانده‌شده</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">جدید (کلیک جهت خواندن)</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
