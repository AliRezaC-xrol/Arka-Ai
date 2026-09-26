"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUp,
  Ban,
  Check,
  Clock,
  Copy,
  Download,
  Image as ImageIcon,
  Key,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Settings,
  Square,
  SquarePen,
  X,
} from "lucide-react";

import {
  ModelPicker,
  type ModelGroup,
} from "@/components/model-picker";
import {
  SpotlightList,
  type SpotlightEntry,
  type SpotlightGroup,
} from "@/components/spotlight-list";
import { UserMenu } from "@/components/user-menu";
import { NotificationsMenu } from "@/components/notifications-menu";
import { ByokManager } from "@/components/byok-manager";
import type { ModelCapabilities } from "@/lib/ai-client";
import { ArkaMark } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedMessage } from "@/components/code-block";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** The model's chain of thought, streamed separately from the answer. */
  reasoning?: string;
  contentType?: "text" | "image" | "code";
  createdAt?: string;
  isStreaming?: boolean;
}

/**
 * The model list is 100% real: it is built from the providers the admin has
 * activated plus the user's own verified BYOK providers. There is no hardcoded
 * catalogue any more — a model only appears here if a live provider serves it.
 */
const SUGGESTIONS = [
  {
    title: "خودت را معرفی کن",
    prompt: "خودت را به عنوان دستیار هوشمند ارکا معرفی کن و بگو چطور می‌توانی در کارها کمکم کنی.",
  },
  {
    title: "چطور روزم را بهتر برنامه‌ریزی کنم؟",
    prompt: "یک روش ساده و موثر برای مدیریت زمان و اولویت‌بندی کارهای روزانه به من پیشنهاد بده.",
  },
  {
    title: "پایتخت فرانسه کجاست؟",
    prompt: "پایتخت فرانسه کجاست؟ و سه مکان تاریخی و گردشگری مهم آن را نام ببر.",
  },
  {
    title: "یک متن انگیزشی کوتاه بگو",
    prompt: "یک جمله انگیزشی کوتاه، عمیق و پرانرژی برای شروع یک روز کاری پرچالش بنویس.",
  },
];

function ClaudeThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 py-3 text-neutral-400">
      <div className="relative flex items-center justify-center">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/40 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-white/70" />
        </span>
      </div>
      <span className="animate-pulse text-[12.5px] font-medium tracking-wide text-neutral-300">
        در حال پردازش و نگارش پاسخ...
      </span>
    </div>
  );
}

function ImageMessageCard({ content }: { content: string }) {
  let imageUrl = "";
  let caption = "";

  try {
    const parsed = JSON.parse(content);
    imageUrl = parsed.imageUrl || "";
    caption = parsed.caption || "";
  } catch {
    imageUrl = content;
  }

  return (
    <div className="my-2 max-w-xl overflow-hidden rounded-[20px] border border-white/10 bg-[#121214]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={caption || "تصویر تولیدشده"}
          className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
      </div>
      {caption && (
        <div className="flex items-center justify-between border-t border-white/5 p-3 text-xs text-neutral-300">
          <span className="truncate">{caption}</span>
          <a
            href={imageUrl}
            download="arka-ai-image.svg"
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
            title="دانلود تصویر"
          >
            <Download className="size-3.5" />
            <span>دانلود</span>
          </a>
        </div>
      )}
    </div>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("id");

  // User session state
  const [user, setUser] = React.useState<{
    id?: string;
    name?: string | null;
    email?: string;
    avatarUrl?: string | null;
    isBanned?: boolean;
    banReason?: string | null;
    isTimedOut?: boolean;
    timeoutUntil?: string | null;
    timeoutReason?: string | null;
  } | null>(null);

  // Live countdown state for timeout
  const [timeoutRemainingSeconds, setTimeoutRemainingSeconds] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!user?.timeoutUntil) {
      setTimeoutRemainingSeconds(null);
      return;
    }

    const checkTimeout = () => {
      const diffMs = new Date(user.timeoutUntil!).getTime() - Date.now();
      const seconds = Math.max(0, Math.floor(diffMs / 1000));
      setTimeoutRemainingSeconds(seconds);

      if (seconds === 0) {
        setUser((prev) => (prev ? { ...prev, isTimedOut: false, timeoutUntil: null } : null));
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [user?.timeoutUntil]);

  // Conversations and messages
  const [conversations, setConversations] = React.useState<ConversationItem[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);

  // Selected Model — encoded as "ProviderName:model-id". Empty until the real
  // provider list has loaded, then auto-filled with the first available model.
  const [model, setModel] = React.useState("");

  // User personal providers
  const [userProviders, setUserProviders] = React.useState<
    Array<{
      id: string;
      name: string;
      providerType: string;
      status: string;
      models?: string | null;
    }>
  >([]);

  // Admin configured site providers
  const [siteProviders, setSiteProviders] = React.useState<
    Array<{
      id: string;
      name: string;
      type: string;
      models?: string | null;
    }>
  >([]);

  const loadUserProviders = React.useCallback(() => {
    fetch("/api/user-providers")
      .then((res) => res.json())
      .then((data) => {
        setUserProviders(data.providers || []);
      })
      .catch(() => {});
  }, []);

  const loadSiteProviders = React.useCallback(() => {
    fetch("/api/site-providers")
      .then((res) => res.json())
      .then((data) => {
        setSiteProviders(data.providers || []);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    loadUserProviders();
    loadSiteProviders();
  }, [loadUserProviders, loadSiteProviders]);

  const modelGroups: ModelGroup[] = React.useMemo(() => {
    const list: ModelGroup[] = [];

    // Admin-activated providers — visible to every user.
    for (const p of siteProviders) {
      const pModels = (p.models || "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
      if (pModels.length === 0) continue;
      list.push({
        provider: p.name,
        models: pModels,
        isSiteProvider: true,
        providerId: p.id,
      });
    }

    // The user's own verified BYOK providers.
    for (const p of userProviders) {
      if (p.status !== "connected") continue;
      const pModels = (p.models || "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
      if (pModels.length === 0) continue;
      list.push({
        provider: p.name,
        models: pModels,
        isUserProvider: true,
        providerId: p.id,
      });
    }

    return list;
  }, [siteProviders, userProviders]);

  // Keep the selection valid: if nothing is selected (or the selected model
  // disappeared) fall back to the first real model available.
  React.useEffect(() => {
    const ids = modelGroups.flatMap((g) => g.models.map((m) => `${g.provider}:${m}`));
    if (ids.length === 0) {
      if (model) setModel("");
      return;
    }
    if (!ids.includes(model)) setModel(ids[0]);
  }, [modelGroups, model]);

  /**
   * What the selected model can actually accept. Asked from the provider on
   * every model switch so the attach button reflects reality instead of a
   * hardcoded guess.
   */
  const [modelCaps, setModelCaps] = React.useState<ModelCapabilities | null>(null);

  React.useEffect(() => {
    const sep = model.indexOf(":");
    if (sep === -1) {
      setModelCaps(null);
      return;
    }

    const providerName = model.slice(0, sep);
    const modelId = model.slice(sep + 1);

    const up = userProviders.find((p) => p.name === providerName && p.status === "connected");
    const sp = siteProviders.find((p) => p.name === providerName);

    if (!up && !sp) {
      setModelCaps(null);
      return;
    }

    let cancelled = false;

    fetch("/api/model-capabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        userProviderId: up?.id,
        providerId: up ? undefined : sp?.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.capabilities) setModelCaps(data.capabilities);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [model, userProviders, siteProviders]);

  /** The model cannot take any attachment at all. */
  const attachmentsBlocked = Boolean(modelCaps && !modelCaps.vision && !modelCaps.files);

  // Composer state
  const [input, setInput] = React.useState("");
  const [attachment, setAttachment] = React.useState<{ name: string; url: string } | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  /**
   * The conversation we are actually talking to.
   *
   * Kept in a ref instead of deriving it from the URL: the URL is only synced
   * with history.replaceState, because a real router.push() mid-stream
   * re-renders this page and destroys the in-flight answer. That was why every
   * conversation appeared to answer only its first message.
   */
  const conversationIdRef = React.useRef<string | null>(null);
  const [isThinking, setIsThinking] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // UI state: Dock / Sidebar
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [byokOpen, setByokOpen] = React.useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(true); // Collapsed by default like reference video
  const [searchQuery, setSearchQuery] = React.useState("");
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-expand textarea dynamically
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Fetch current user session
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

  // Fetch user conversations
  const loadConversations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  React.useEffect(() => {
    conversationIdRef.current = activeId ?? null;

    if (!activeId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setIsLoadingMessages(true);

    fetch(`/api/conversations/${activeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setMessages(data.conversation?.messages || []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Auto scroll to bottom
  const scrollToBottom = React.useCallback((smooth = true) => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  React.useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, activeId, scrollToBottom]);

  // Group conversations by date and pin status
  const conversationGroups = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = conversations.filter((c) =>
      q ? c.title.toLowerCase().includes(q) : true,
    );

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;
    const monthStart = todayStart - 30 * 86400000;

    const pinned: SpotlightEntry[] = [];
    const today: SpotlightEntry[] = [];
    const yesterday: SpotlightEntry[] = [];
    const week: SpotlightEntry[] = [];
    const month: SpotlightEntry[] = [];
    const older: SpotlightEntry[] = [];

    for (const conv of filtered) {
      const entry: SpotlightEntry = {
        id: conv.id,
        title: conv.title,
        isPinned: conv.isPinned,
      };

      if (conv.isPinned) {
        pinned.push(entry);
        continue;
      }

      const t = new Date(conv.updatedAt).getTime();
      if (t >= todayStart) {
        today.push(entry);
      } else if (t >= yesterdayStart) {
        yesterday.push(entry);
      } else if (t >= weekStart) {
        week.push(entry);
      } else if (t >= monthStart) {
        month.push(entry);
      } else {
        older.push(entry);
      }
    }

    const groups: SpotlightGroup[] = [];
    if (pinned.length > 0) groups.push({ label: "سنجاق‌شده‌ها", items: pinned });
    if (today.length > 0) groups.push({ label: "امروز", items: today });
    if (yesterday.length > 0) groups.push({ label: "دیروز", items: yesterday });
    if (week.length > 0) groups.push({ label: "۷ روز گذشته", items: week });
    if (month.length > 0) groups.push({ label: "۳۰ روز گذشته", items: month });
    if (older.length > 0) groups.push({ label: "قدیمی‌تر", items: older });

    return groups;
  }, [conversations, searchQuery]);

  const handleSelectConversation = (id: string) => {
    router.push(`/chat?id=${id}`);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    router.push("/chat");
    setMessages([]);
    setAttachment(null);
    setInput("");
    setSidebarOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isPinned } : c)),
        );
      }
    } catch (err) {
      console.error("Pin failed:", err);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
        );
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const currentConv = conversations.find((c) => c.id === activeId);
    const titleText = currentConv?.title || "گفتگوی ارکا";
    const dateStr = new Date().toLocaleDateString("fa-IR");

    let md = `# ${titleText}\n`;
    md += `تاریخ: ${dateStr}\n`;
    md += `مدل: ${model.split(":")[1] || model}\n\n`;
    md += `---\n\n`;

    for (const m of messages) {
      const sender = m.role === "user" ? "کاربر" : "ارکا";
      md += `### ${sender}:\n\n${m.content}\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `arka-${activeId || "chat"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAttachment({
      name: file.name,
      url,
    });
    e.target.value = "";
  };

  /** Id of the message whose copy button just fired (drives the spring anim). */
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyMessage = React.useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API needs a secure context; fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1400);
  }, []);

  /** Load a sent message back into the composer so it can be edited and resent. */
  const handleEditMessage = React.useCallback((content: string) => {
    setInput(content);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      el?.focus();
      el?.setSelectionRange(content.length, content.length);
    });
  }, []);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsThinking(false);
  };

  const handleSend = async (messageText?: string) => {
    if (user?.isBanned) return;
    if (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0) return;

    const textToSend = (messageText ?? input).trim();
    if (!textToSend && !attachment) return;
    if (isStreaming) return;

    // Selection is encoded as "ProviderName:model-id" — split on the FIRST
    // colon only, because real model ids contain slashes/colons themselves
    // (e.g. OpenRouter's "anthropic/claude-sonnet-4").
    const sepIndex = model.indexOf(":");
    const selectedProviderName = sepIndex === -1 ? "" : model.slice(0, sepIndex);
    const currentModelName = sepIndex === -1 ? model : model.slice(sepIndex + 1);

    if (!currentModelName) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "⚠️ هیچ مدلی انتخاب نشده است. ابتدا از فهرست مدل‌ها یک مدل انتخاب کنید، یا از «کلیدهای API من» یک کلید اضافه کنید.",
        },
      ]);
      return;
    }

    const matchingProvider = userProviders.find(
      (p) => p.name === selectedProviderName && p.status === "connected",
    );
    const matchingSiteProvider = siteProviders.find(
      (p) => p.name === selectedProviderName,
    );

    const tempUserMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempUserMsgId,
      role: "user",
      content: textToSend,
      contentType: attachment ? "image" : "text",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachment(null);
    setIsThinking(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationIdRef.current || activeId || undefined,
          message: textToSend,
          model: currentModelName,
          providerId: matchingSiteProvider?.id,
          userProviderId: matchingProvider?.id,
          attachment: attachment?.url,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `خطا در برقراری ارتباط (${res.status})`;
        throw new Error(errorMsg);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        setIsThinking(false);
        setIsStreaming(false);

        if (data.type === "image") {
          const assistantMsg: ChatMessage = {
            id: data.assistantMessageId || `img-${Date.now()}`,
            role: "assistant",
            content: JSON.stringify({
              imageUrl: data.imageUrl,
              caption: data.caption,
            }),
            contentType: "image",
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }

        if (data.isNewConversation && data.conversationId) {
          router.push(`/chat?id=${data.conversationId}`);
          loadConversations();
        }
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      const assistantMsgId = `assistant-${Date.now()}`;
      let accumulatedText = "";
      let accumulatedReasoning = "";
      let hasAddedAssistantMsg = false;
      /**
       * SSE frames get split across network chunks constantly. Without this
       * buffer a frame cut in half fails JSON.parse and is silently discarded,
       * which truncated long answers. Keep the trailing partial line.
       */
      let lineBuffer = "";

      const handleEvent = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const dataStr = line.slice(6).trim();
        if (!dataStr) return;

        try {
          const eventData = JSON.parse(dataStr);

          if (eventData.type === "start") {
                setIsThinking(false);
                if (eventData.conversationId) {
                  conversationIdRef.current = eventData.conversationId;
                  if (eventData.isNewConversation) {
                    // Sync the URL WITHOUT a router navigation. A push() here
                    // re-renders the page mid-stream and wipes the answer.
                    window.history.replaceState(
                      null,
                      "",
                      `/chat?id=${eventData.conversationId}`,
                    );
                    loadConversations();
                  }
                }
              } else if (eventData.type === "chunk") {
                setIsThinking(false);

                // Reasoning arrives first and separately: show it in the
                // "thinking" block, then the answer streams in below it.
                if (eventData.reasoning) {
                  accumulatedReasoning += eventData.text;
                  if (!hasAddedAssistantMsg) {
                    hasAddedAssistantMsg = true;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: assistantMsgId,
                        role: "assistant",
                        content: "",
                        reasoning: accumulatedReasoning,
                        isStreaming: true,
                      },
                    ]);
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId
                          ? { ...msg, reasoning: accumulatedReasoning }
                          : msg,
                      ),
                    );
                  }
                  scrollToBottom();
                  return;
                }

                accumulatedText += eventData.text;

                if (!hasAddedAssistantMsg) {
                  hasAddedAssistantMsg = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: accumulatedText,
                      isStreaming: true,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulatedText }
                        : msg,
                    ),
                  );
                }
                scrollToBottom();
              } else if (eventData.type === "error") {
                accumulatedText += `${accumulatedText ? "\n\n" : ""}⚠️ ${eventData.message}`;
                if (!hasAddedAssistantMsg) {
                  hasAddedAssistantMsg = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: accumulatedText,
                      isStreaming: false,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulatedText, isStreaming: false }
                        : msg,
                    ),
                  );
                }
              } else if (eventData.type === "done") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, isStreaming: false }
                      : msg,
                  ),
                );
              }
        } catch {
          // ignore a malformed frame rather than killing the whole stream
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) handleEvent(line);
      }

      // Flush a final frame that arrived without a trailing newline.
      if (lineBuffer) handleEvent(lineBuffer);
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("Send error:", err);
        const errMsg =
          (err as Error)?.message ||
          "متأسفانه در برقراری ارتباط با مدل خطایی رخ داد. لطفاً دوباره تلاش کنید.";
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ ${errMsg}`,
          },
        ]);
      }
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeTitle = conversations.find((c) => c.id === activeId)?.title;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#070709] text-foreground" dir="rtl">
      {/* ================= Dock / Sidebar ================= */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex shrink-0 flex-col border-e border-white/5 bg-[#0b0b0e] transition-all duration-300 ease-in-out md:static",
          // Mobile state
          sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0",
          // Desktop state
          desktopCollapsed ? "md:w-16 p-2" : "md:w-80 p-3",
        )}
      >
        {desktopCollapsed ? (
          /* Desktop Collapsed Icon Dock Mode (Clean reference-styled) */
          <div className="hidden md:flex h-full flex-col items-center justify-between py-3">
            <div className="flex flex-col items-center gap-3.5">
              <button
                type="button"
                onClick={() => setDesktopCollapsed(false)}
                className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 transition-colors"
                title="باز کردن تاریخچه گفتگوها"
              >
                <ArkaMark className="size-4" />
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                className="grid size-9 place-items-center rounded-xl bg-white text-black hover:bg-neutral-200 transition-all shadow"
                title="گفتگوی جدید"
              >
                <Plus className="size-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => setDesktopCollapsed(false)}
                className="grid size-9 place-items-center rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="جستجو در گفتگوها"
              >
                <Search className="size-3.5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2.5">
              <Link
                href="/settings/providers"
                className="grid size-9 place-items-center rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="پروایدرهای شخصی (BYOK)"
              >
                <Key className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Expanded Full Sidebar */
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <Link href="/" className="flex items-center gap-2 px-1">
                <ArkaMark className="size-5 text-white" />
                <span dir="ltr" className="font-display text-[15px] font-bold tracking-tight text-white">
                  ARKA
                </span>
              </Link>

              <div className="flex items-center gap-1">
                {/* Only the header carries the sidebar toggle — see below. */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="grid size-8 place-items-center rounded-control text-neutral-400 hover:bg-white/5 hover:text-white md:hidden"
                  title="بستن"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="pt-3 pb-2">
              <Button
                type="button"
                onClick={handleNewChat}
                className="w-full justify-start gap-2 bg-white text-xs font-bold text-black hover:bg-neutral-200 shadow-sm h-9 rounded-xl"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>گفتگوی جدید</span>
              </Button>
            </div>

            <div className="relative my-2">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در گفتگوها..."
                className="h-8 ps-8 pe-3 text-xs bg-black/40 border-white/10 placeholder:text-neutral-500 rounded-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              <SpotlightList
                groups={conversationGroups}
                activeId={activeId}
                onSelect={handleSelectConversation}
                onPin={handlePin}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            </div>

            {/* Footer: API-keys box (BYOK) + a working account entry.
                The old "حساب کاربری" link pointed at /settings/account, which
                does not exist — every click 404'd. */}
            <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => setByokOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-start text-xs text-amber-200 transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.1]"
              >
                <Key className="size-3.5 shrink-0 text-amber-400" />
                <span className="flex-1 font-semibold">کلیدهای API من</span>
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                  {userProviders.filter((p) => p.status === "connected").length} متصل
                </span>
              </button>

              <Link
                href="/settings"
                className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-xs text-neutral-300 transition-colors hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
              >
                <Settings className="size-3.5 shrink-0" />
                <span className="flex-1 font-semibold">حساب کاربری و تنظیمات</span>
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= Main Chat Section ================= */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#070709]">
        {/* Animated monochrome aurora — the flowing-light look from the
            reference video, retinted to the black/white palette (no blue).
            Negative z-index keeps it above the panel colour but below content. */}
        <div aria-hidden className="aurora-mono -z-10" />

        {/* Top Header Bar matching Video 1 exactly */}
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between px-4 sm:px-6 bg-background/60 backdrop-blur-md">
          {/* Left Side: Sidebar toggle + New chat + Arka Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setDesktopCollapsed(!desktopCollapsed);
                }
              }}
              className="grid size-8 place-items-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              title="تغییر وضعیت نوار کناری"
            >
              {desktopCollapsed ? (
                <PanelRightOpen className="size-4" />
              ) : (
                <PanelRightClose className="size-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNewChat}
              className="grid size-8 place-items-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              title="گفتگوی جدید"
            >
              <SquarePen className="size-4" />
            </button>

            <span className="ms-1 font-display text-[14px] font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>ARKA</span>
              {activeTitle && (
                <span className="text-xs text-neutral-400 font-normal truncate max-w-[140px] sm:max-w-xs">
                  / {activeTitle}
                </span>
              )}
            </span>
          </div>

          {/* Right Side: Export + User */}
          <div className="flex items-center gap-2.5">
            {/* Export conversation */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleExportChat}
                className="grid size-8 place-items-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="دانلود و خروجی گفت‌وگو"
              >
                <Download className="size-4" />
              </button>
            )}

            {/* Notification Menu */}
            <NotificationsMenu />

            {/* BYOK lives in ONE place only: the highlighted box at the bottom
                of the sidebar. The duplicate header button was removed so the
                key manager is never opened from two different spots. */}

            {/* User Profile */}
            <div className="w-32 sm:w-40">
              <UserMenu
                name={user?.name || "کاربر ارکا"}
                subtitle={user?.email || "حساب گوگل"}
                avatarUrl={user?.avatarUrl}
                placement="down"
              />
            </div>
          </div>
        </header>

        {/* Chat Messages Scroll View OR Empty State */}
        <div
          ref={chatScrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8"
        >
          {messages.length === 0 && !isLoadingMessages ? (
            /* ================= Exact Empty State matching Video 1 ================= */
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center py-6">
              {/* Staggered entrance: title → subtitle → composer → chips.
                  `.enter` lives in globals.css and is disabled under
                  prefers-reduced-motion. */}
              <h1 className="enter [--enter-delay:0ms] text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                چطور می‌توانم کمکت کنم؟
              </h1>
              <p className="enter [--enter-delay:70ms] mt-2 text-xs sm:text-[13px] text-neutral-400">
                هر چه می‌خواهید بپرسید — تاریخچه فقط روی همین دستگاه می‌ماند.
              </p>

              {/* Center Floating Capsule Composer (Video 1 recreation) */}
              <div className="enter [--enter-delay:150ms] w-full mt-7 text-start">
                {/* Ban Banner */}
                {user?.isBanned && (
                  <div className="mb-3 rounded-[20px] border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200">
                    <div className="flex items-center gap-2 font-bold text-red-400 text-sm mb-1">
                      <Ban className="size-4" />
                      <span>حساب شما مسدود شده است</span>
                    </div>
                    <p className="leading-5">
                      دسترسی به ارسال پیام به دلیل تصمیم مدیریت قطع گردیده است.
                      {user.banReason && (
                        <span className="block mt-1 text-red-300">علت: {user.banReason}</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Timeout Banner */}
                {timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0 && (
                  <div className="mb-3 rounded-[20px] border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-amber-400 shrink-0" />
                      <span>
                        موقتاً محدود شده‌اید ({Math.ceil(timeoutRemainingSeconds / 60)} دقیقه دیگر)
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold bg-black/60 px-2.5 py-0.5 rounded-full text-amber-300">
                      {Math.floor(timeoutRemainingSeconds / 60)}:
                      {String(timeoutRemainingSeconds % 60).padStart(2, "0")}
                    </span>
                  </div>
                )}

                {/* No models available — guide the user to connect a real key */}
                {modelGroups.length === 0 && (
                  <div className="mb-3 rounded-[20px] border border-amber-500/40 bg-amber-500/[0.08] p-3.5 text-xs text-amber-200">
                    <div className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-300">
                      <AlertCircle className="size-4" />
                      <span>هیچ مدلی در دسترس نیست</span>
                    </div>
                    <p className="leading-5">
                      هنوز هیچ پروایدری توسط مدیر سیستم فعال نشده و شما هم کلید شخصی ثبت نکرده‌اید. برای شروع،
                      کلید API خودتان را اضافه کنید.
                    </p>
                    <button
                      type="button"
                      onClick={() => setByokOpen(true)}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11.5px] font-bold text-black transition-colors hover:bg-neutral-200"
                    >
                      <Key className="size-3" />
                      افزودن کلید API
                    </button>
                  </div>
                )}

                {/* Attachment chip */}
                {attachment && (
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#161619] px-3 py-1 text-xs text-neutral-300">
                    <Paperclip className="size-3 text-neutral-400" />
                    <span className="max-w-[180px] truncate">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="rounded-full p-0.5 hover:bg-white/10"
                    >
                      <X className="size-3 text-neutral-400" />
                    </button>
                  </div>
                )}

                {/* The Capsule Composer Box */}
                <div className="rounded-[26px] border border-white/10 bg-[#121215]/90 backdrop-blur-2xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all focus-within:border-white/25 focus-within:shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))}
                    placeholder="هر چیزی بپرسید..."
                    rows={1}
                    className="w-full resize-none bg-transparent px-2 text-[14px] leading-6 text-white placeholder:text-neutral-500 focus:outline-none min-h-[38px] max-h-36"
                  />

                  {/* Bottom Control Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    {/* Model Pill + Quality + Attachments */}
                    <div className="flex items-center gap-2">
                      <ModelPicker
                        groups={modelGroups}
                        value={model}
                        onChange={setModel}
                        className="text-xs"
                      />

                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,text/*,.pdf"
                        onChange={handleFileChange}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))}
                        className="grid size-8 place-items-center rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="پیوست فایل"
                      >
                        <Paperclip className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={Boolean(
                          attachmentsBlocked ||
                            user?.isBanned ||
                            (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0),
                        )}
                        className="grid size-8 place-items-center rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                        title={attachmentsBlocked ? "این مدل از پیوست تصویر پشتیبانی نمی‌کند" : "پیوست تصویر"}
                      >
                        <ImageIcon className="size-3.5" />
                      </button>
                    </div>

                    {/* Circular Send Button */}
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={
                        !model || (!input.trim() && !attachment) ||
                        Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))
                      }
                      className="grid size-8 place-items-center rounded-full bg-white text-black hover:bg-neutral-200 transition-all shadow disabled:opacity-30 disabled:hover:bg-white"
                      title="ارسال پیام"
                    >
                      <ArrowUp className="size-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Exact Suggestion Pills beneath Composer (Video 1 matching) */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-xl">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleSend(item.prompt)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-neutral-300 transition-all hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Footnote below pills */}
              <p className="mt-4 text-[11px] text-neutral-500">
                گفتگوها فقط روی همین دستگاه ذخیره می‌شود.
              </p>
            </div>
          ) : (
            /* ================= Message List ================= */
            <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-28">
              {messages.map((msg) => {
                const isUser = msg.role === "user";

                if (isUser) {
                  const justSent = msg.id.startsWith("user-");
                  return (
                    <div
                      key={msg.id}
                      className="group ms-auto flex max-w-[85%] flex-col items-end sm:max-w-[75%]"
                    >
                      <div
                        className={cn(
                          "rounded-[22px] rounded-se-sm border border-white/10 bg-[#1a1a1f] px-4 py-3 text-start text-[14px] leading-7 text-white shadow-sm",
                          // Bubble grows out of the send corner, iMessage-style.
                          "[--bubble-origin:100%_100%]",
                          justSent && "msg-send-pop",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                          title="کپی پیام"
                        >
                          {copiedId === msg.id ? (
                            <Check className="copy-pop size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          <span>{copiedId === msg.id ? "کپی شد" : "کپی"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditMessage(msg.content)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                          title="ویرایش و ارسال دوباره به مدل"
                        >
                          <Pencil className="size-3" />
                          <span>ویرایش</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="group me-auto flex w-full flex-col items-start text-start">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="grid size-6 place-items-center rounded-lg border border-white/15 bg-white/5">
                        <ArkaMark className="size-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-300">ارکا</span>

                      {msg.contentType !== "image" && msg.content.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] text-neutral-500 opacity-0 transition-all duration-200 hover:bg-white/[0.06] hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
                          title="کپی پاسخ"
                        >
                          {copiedId === msg.id ? (
                            <Check className="copy-pop size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          <span>{copiedId === msg.id ? "کپی شد" : "کپی"}</span>
                        </button>
                      )}
                    </div>

                    {msg.reasoning && (
                      <details
                        open={Boolean(msg.isStreaming)}
                        className="msg-soft-in mb-3 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5"
                      >
                        <summary className="cursor-pointer select-none list-none text-[11.5px] font-semibold text-neutral-300 transition-colors hover:text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              aria-hidden
                              className={cn(
                                "size-1.5 rounded-full bg-neutral-400",
                                msg.isStreaming && "animate-pulse bg-emerald-400",
                              )}
                            />
                            {msg.isStreaming ? "در حال فکر کردن…" : "روند فکر کردن مدل"}
                          </span>
                        </summary>
                        <p className="mt-2.5 whitespace-pre-wrap text-[12.5px] leading-6 text-neutral-400">
                          {msg.reasoning}
                        </p>
                      </details>
                    )}

                    {msg.contentType === "image" ? (
                      <ImageMessageCard content={msg.content} />
                    ) : (
                      <div className="w-full text-[14.5px] leading-8 text-neutral-200">
                        <FormattedMessage content={msg.content} />
                      </div>
                    )}
                  </div>
                );
              })}

              {isThinking && <ClaudeThinkingIndicator />}
            </div>
          )}
        </div>

        {/* ================= Bottom Docked Composer (When messages exist) =================
            No border and no tinted backdrop: the page background (and the aurora)
            flow straight under the composer instead of it sitting in its own
            separated box. */}
        {messages.length > 0 && (
          <div className="relative z-10 shrink-0 p-3 sm:p-4">
            <div className="mx-auto max-w-3xl">
              {attachment && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#161619] px-3 py-1 text-xs text-neutral-300">
                  <Paperclip className="size-3 text-neutral-400" />
                  <span className="max-w-[180px] truncate">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="rounded-full p-0.5 hover:bg-white/10"
                  >
                    <X className="size-3 text-neutral-400" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isStreaming) {
                    handleStop();
                  } else {
                    handleSend();
                  }
                }}
                className="relative flex items-end gap-2 rounded-[24px] border border-white/10 bg-[#121215] p-2 shadow-sm transition-colors focus-within:border-white/25"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,text/*,.pdf"
                  onChange={handleFileChange}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={Boolean(
                    attachmentsBlocked ||
                      user?.isBanned ||
                      (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0),
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  className="size-8 shrink-0 rounded-full text-neutral-400 hover:text-white"
                  title={attachmentsBlocked ? "این مدل از پیوست پشتیبانی نمی‌کند" : "پیوست فایل یا تصویر"}
                >
                  <Paperclip className="size-4" />
                </Button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))}
                  placeholder="هر چیزی بپرسید..."
                  rows={1}
                  className="max-h-36 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-[13.5px] leading-6 text-white placeholder:text-neutral-500 focus:outline-none"
                />

                {isStreaming ? (
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleStop}
                    className="size-8 shrink-0 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    title="توقف پاسخ"
                  >
                    <Square className="size-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      !model || (!input.trim() && !attachment) ||
                      Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))
                    }
                    className="size-8 shrink-0 rounded-full bg-white text-black hover:bg-neutral-200 shadow disabled:opacity-30"
                    title="ارسال پیام"
                  >
                    <ArrowUp className="size-4 stroke-[2.5]" />
                  </Button>
                )}
              </form>

              <div className="mt-2 flex items-center justify-between px-2 text-[10.5px] text-neutral-500">
                <span>ارکا ممکن است خطا کند؛ خروجی‌های مهم را بررسی فرمایید.</span>
                <span className="hidden sm:inline font-mono">مدل: {model.split(":")[1] || model}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BYOK manager — add / edit / verify personal API keys without leaving the chat */}
      <ByokManager
        open={byokOpen}
        onClose={() => setByokOpen(false)}
        onChanged={() => {
          loadUserProviders();
          loadSiteProviders();
        }}
        providers={userProviders}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#070709] text-white">
          <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      }
    >
      <ChatContent />
    </React.Suspense>
  );
}
