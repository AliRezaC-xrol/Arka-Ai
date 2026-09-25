"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCheck,
  Clock,
  Eye,
  Mail,
  Radio,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface BroadcastRecipient {
  recipientId: string;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  isDeleted: boolean;
}

export interface AdminBroadcastMessage {
  id: string;
  title: string | null;
  content: string;
  sentAt: string;
  sentToAll: boolean;
  stats: {
    totalRecipients: number;
    readRecipients: number;
    unreadRecipients: number;
    readPercentage: number;
    deletedRecipients: number;
  };
  recipients: BroadcastRecipient[];
}

export interface SimpleUserOption {
  id: string;
  name: string | null;
  email: string;
}

export function BroadcastsManager() {
  const [messages, setMessages] = React.useState<AdminBroadcastMessage[]>([]);
  const [loading, setLoading] = React.useState(true);

  // New Message Form State
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [recipientType, setRecipientType] = React.useState<"all" | "single">("all");
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [userSearchQuery, setUserSearchQuery] = React.useState("");
  const [allUsers, setAllUsers] = React.useState<SimpleUserOption[]>([]);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSuccess, setFormSuccess] = React.useState(false);

  // Recipients Breakdown Modal
  const [viewingMessage, setViewingMessage] = React.useState<AdminBroadcastMessage | null>(null);

  // Delete for All Confirmation Modal
  const [deletingMessage, setDeletingMessage] = React.useState<AdminBroadcastMessage | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Delete Single Recipient action loading
  const [singleDeleteLoadingId, setSingleDeleteLoadingId] = React.useState<string | null>(null);

  // Fetch broadcasts list
  const fetchMessages = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/broadcasts");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Fetch broadcasts error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users for recipient picker
  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?limit=100");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error("Fetch users for broadcasts error:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [fetchMessages, fetchUsers]);

  // Handle Send New Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormError(null);
    setFormSuccess(false);

    if (!content.trim()) {
      setFormError("متن پیام نمی‌تواند خالی باشد.");
      setSubmitLoading(false);
      return;
    }

    if (recipientType === "single" && !selectedUserId) {
      setFormError("لطفاً یک کاربر گیرنده انتخاب کنید.");
      setSubmitLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          sentToAll: recipientType === "all",
          recipientUserId: recipientType === "single" ? selectedUserId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ارسال پیام");
      }

      setTitle("");
      setContent("");
      setSelectedUserId("");
      setFormSuccess(true);
      fetchMessages();
      setTimeout(() => setFormSuccess(false), 4000);
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Delete Broadcast for All
  const handleConfirmDeleteAll = async () => {
    if (!deletingMessage) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/broadcasts/${deletingMessage.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingMessage(null);
        if (viewingMessage?.id === deletingMessage.id) {
          setViewingMessage(null);
        }
        fetchMessages();
      }
    } catch (err) {
      console.error("Delete broadcast for all failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Delete Broadcast for Single Recipient
  const handleDeleteForSingleRecipient = async (messageId: string, userId: string) => {
    setSingleDeleteLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/broadcasts/${messageId}/recipients/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Refresh local viewing state
        if (viewingMessage && viewingMessage.id === messageId) {
          setViewingMessage((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              recipients: prev.recipients.map((r) =>
                r.userId === userId ? { ...r, isDeleted: true } : r,
              ),
            };
          });
        }
        fetchMessages();
      }
    } catch (err) {
      console.error("Delete for single recipient failed:", err);
    } finally {
      setSingleDeleteLoadingId(null);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-white" />
            <h2 className="text-lg font-bold text-white">پیام‌رسانی و اعلان‌های همگانی (Broadcasts)</h2>
          </div>
          <p className="mt-1 text-xs text-foreground-3">
            ارسال پیام و اطلاعیه به صورت همگانی به همه کاربران یا به یک کاربر خاص، با ردیابی دقیق وضعیت خوانده‌شدن.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchMessages}
          className="gap-1.5 text-xs h-8 text-foreground-2 hover:text-white"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          <span>بازخوانی</span>
        </Button>
      </div>

      {/* Grid: New Message Form on Right, Sent Messages on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form: Send New Message (4 cols) */}
        <div className="lg:col-span-5 rounded-card border border-line bg-[#111113] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Send className="size-4 text-white" />
            <h3 className="text-sm font-bold text-white">ارسال پیام یا اعلان جدید</h3>
          </div>

          {formError && (
            <div className="rounded-control border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCheck className="size-4 shrink-0" />
              <span>پیام با موفقیت ارسال شد و در نوار نوتیفیکیشن کاربران قرار گرفت.</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
            {/* Title (Optional) */}
            <div>
              <label className="block text-foreground-2 font-medium mb-1">
                عنوان پیام (اختیاری):
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: بروزرسانی هسته هوش مصنوعی یا اطلاعیه نگهداری"
                className="h-9 text-xs"
              />
            </div>

            {/* Recipient Selection */}
            <div className="space-y-2">
              <label className="block text-foreground-2 font-medium">گیرنده پیام:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType("all");
                    setSelectedUserId("");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-control p-2.5 text-xs font-medium border transition-colors",
                    recipientType === "all"
                      ? "border-white bg-white/10 text-white font-bold"
                      : "border-line bg-card text-foreground-3 hover:text-white",
                  )}
                >
                  <Users className="size-3.5" />
                  <span>همه کاربران (همگانی)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType("single")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-control p-2.5 text-xs font-medium border transition-colors",
                    recipientType === "single"
                      ? "border-white bg-white/10 text-white font-bold"
                      : "border-line bg-card text-foreground-3 hover:text-white",
                  )}
                >
                  <UserIcon className="size-3.5" />
                  <span>یک کاربر خاص</span>
                </button>
              </div>

              {/* Specific User Search & Select */}
              {recipientType === "single" && (
                <div className="mt-2 space-y-2 border border-line rounded-control p-3 bg-black/40">
                  <div className="relative">
                    <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground-3" />
                    <Input
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="جستجوی کاربر با نام یا ایمیل..."
                      className="h-8 ps-8 pe-3 text-xs"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pe-1">
                    {filteredUsers.length === 0 ? (
                      <div className="py-3 text-center text-foreground-3 text-[11px]">کاربری یافت نشد.</div>
                    ) : (
                      filteredUsers.slice(0, 15).map((u) => {
                        const isSelected = selectedUserId === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedUserId(u.id)}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-control cursor-pointer transition-colors text-[11px]",
                              isSelected
                                ? "bg-white/15 text-white font-semibold border border-white/20"
                                : "hover:bg-white/5 text-foreground-2",
                            )}
                          >
                            <span className="truncate">{u.name || "کاربر بدون نام"}</span>
                            <span dir="ltr" className="font-mono text-[10px] text-foreground-3 truncate max-w-[140px]">
                              {u.email}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedUserId && (
                    <div className="pt-1.5 border-t border-line text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>کاربر انتخاب‌شده: {allUsers.find((u) => u.id === selectedUserId)?.name || "کاربر"}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId("")}
                        className="text-foreground-3 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-foreground-2 font-medium mb-1">
                متن کامل پیام / اعلان:
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن اطلاعیه را بنویسید..."
                rows={5}
                required
                className="w-full rounded-control border border-line bg-card p-2.5 text-xs text-foreground placeholder:text-foreground-3 focus:border-white focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <Button
              type="submit"
              disabled={submitLoading}
              className="w-full h-9 bg-white text-black hover:bg-neutral-200 text-xs font-semibold gap-2"
            >
              <Send className="size-3.5" />
              <span>{submitLoading ? "در حال ارسال..." : "ارسال اعلان به کاربران"}</span>
            </Button>
          </form>
        </div>

        {/* List: Sent Messages (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-foreground-2" />
              <h3 className="text-sm font-bold text-white">پیام‌های ارسال‌شده ({messages.length})</h3>
            </div>
          </div>

          {messages.length === 0 && !loading && (
            <div className="rounded-card border border-dashed border-line bg-[#111113] p-10 text-center space-y-2">
              <Radio className="mx-auto size-8 text-foreground-3" />
              <p className="text-xs text-foreground-2 font-medium">هنوز هیچ پیامی ارسال نشده است.</p>
              <p className="text-[11px] text-foreground-3">
                از فرم سمت راست برای ارسال اولین پیام همگانی یا خصوصی استفاده کنید.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg) => {
              const stats = msg.stats;
              const isToAll = msg.sentToAll;

              return (
                <div
                  key={msg.id}
                  className="rounded-card border border-line bg-[#111113] p-4 space-y-3 transition-colors hover:border-white/20"
                >
                  {/* Message Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/50 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">
                        {msg.title || "پیام بدون عنوان"}
                      </span>
                      {isToAll ? (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                          <Users className="size-3" />
                          <span>همه کاربران ({stats.totalRecipients} نفر)</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] text-blue-300 font-medium flex items-center gap-1">
                          <UserIcon className="size-3" />
                          <span>کاربر خاص ({msg.recipients[0]?.name || msg.recipients[0]?.email || "یک نفر"})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] text-foreground-3 font-mono shrink-0">
                      <Clock className="size-3" />
                      <span>{new Date(msg.sentAt).toLocaleDateString("fa-IR")}</span>
                      <span>{new Date(msg.sentAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {/* Message Content Preview */}
                  <p className="text-xs text-foreground-2 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  {/* Read Statistics & Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-line/40 text-xs">
                    {/* Read Stat with Progress Bar */}
                    <div className="flex items-center gap-3 flex-1 max-w-sm">
                      <span className="text-[11px] text-foreground-3 whitespace-nowrap">
                        {stats.readRecipients} از {stats.totalRecipients} نفر خوانده‌اند ({stats.readPercentage}٪)
                      </span>
                      <div className="h-1.5 flex-1 rounded-full bg-black/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${stats.readPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingMessage(msg)}
                        className="h-7 text-[11px] gap-1 text-foreground-2 hover:text-white"
                      >
                        <Eye className="size-3" />
                        <span>وضعیت گیرندگان</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingMessage(msg)}
                        className="h-7 text-[11px] gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="size-3" />
                        <span>حذف برای همه</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modal 1: Recipients Breakdown & Per-User Deletion */}
      {/* ========================================================================= */}
      {viewingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-card border border-line bg-[#141416] p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="size-4" />
                  <span>وضعیت و لیست گیرندگان پیام</span>
                </h3>
                <p className="text-xs text-foreground-3 mt-1">
                  «{viewingMessage.title || "پیام بدون عنوان"}» — {viewingMessage.stats.readRecipients} از {viewingMessage.stats.totalRecipients} نفر خوانده‌اند
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingMessage(null)}
                className="text-foreground-3 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Recipients Table */}
            <div className="mt-4 space-y-2">
              <div className="rounded-control border border-line overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-line bg-black/40 text-foreground-3 font-semibold">
                      <th className="py-2.5 px-3 text-start">گیرنده</th>
                      <th className="py-2.5 px-3 text-center">وضعیت خوانده‌شدن</th>
                      <th className="py-2.5 px-3 text-center">زمان مطالعه</th>
                      <th className="py-2.5 px-3 text-end">اقدام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30">
                    {viewingMessage.recipients.map((rec) => {
                      const isDeletedForUser = rec.isDeleted;
                      const isLoadingThis = singleDeleteLoadingId === rec.userId;

                      return (
                        <tr
                          key={rec.recipientId}
                          className={cn(
                            "hover:bg-white/[0.02] transition-colors",
                            isDeletedForUser && "opacity-40 bg-neutral-900",
                          )}
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white block">{rec.name || "کاربر"}</span>
                            <span dir="ltr" className="font-mono text-[10px] text-foreground-3 block text-start">
                              {rec.email}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {isDeletedForUser ? (
                              <span className="text-[10px] text-neutral-400">حذف‌شده برای این کاربر</span>
                            ) : rec.isRead ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 text-[10px] text-emerald-300 font-medium">
                                <CheckCheck className="size-3" />
                                <span>خوانده‌شده</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 border border-line px-2 py-0.2 text-[10px] text-foreground-3">
                                <span>خوانده‌نشده</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono text-[10px] text-foreground-3">
                            {rec.readAt ? (
                              <span>
                                {new Date(rec.readAt).toLocaleDateString("fa-IR")} -{" "}
                                {new Date(rec.readAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-end">
                            {!isDeletedForUser ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isLoadingThis}
                                onClick={() => handleDeleteForSingleRecipient(viewingMessage.id, rec.userId)}
                                className="h-6 text-[10.5px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="فقط از این کاربر حذف شود (سایر کاربران هنوز پیام را دارند)"
                              >
                                {isLoadingThis ? "..." : "حذف فقط برای این کاربر"}
                              </Button>
                            ) : (
                              <span className="text-[10px] text-foreground-3">حذف‌شده</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewingMessage(null)}
                className="h-8 text-xs ms-auto"
              >
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 2: Delete Broadcast for All Confirmation */}
      {/* ========================================================================= */}
      {deletingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-card border border-red-500/30 bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl border border-red-500/30 bg-red-500/10 grid place-items-center shrink-0">
                <AlertTriangle className="size-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">حذف کامل پیام برای همه گیرندگان</h3>
                <p className="mt-2 text-xs text-foreground-3 leading-relaxed">
                  آیا از حذف این پیام برای تمام گیرندگان (<strong>{deletingMessage.stats.totalRecipients} نفر</strong>) مطمئن هستید؟ پیام از صندوق ورودی کلیه کاربران فوراً برداشته خواهد شد.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleteLoading}
                onClick={() => setDeletingMessage(null)}
                className="h-9 text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteAll}
                className="h-9 text-xs bg-red-600 text-white hover:bg-red-700 font-semibold"
              >
                {deleteLoading ? "در حال حذف..." : "بله، حذف برای همه"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
