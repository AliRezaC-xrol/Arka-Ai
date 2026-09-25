"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUp,
  Ban,
  Clock,
  Code,
  Download,
  Image as ImageIcon,
  Lightbulb,
  Menu,
  Paperclip,
  PenLine,
  Plus,
  Search,
  Square,
  X,
  type LucideIcon,
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
  contentType?: "text" | "image" | "code";
  createdAt?: string;
  isStreaming?: boolean;
}

const BASE_MODEL_GROUPS: ModelGroup[] = [
  { provider: "Anthropic", models: ["Claude Sonnet 4", "Claude 3.5 Haiku"] },
  { provider: "OpenAI", models: ["GPT-4o", "GPT-4o mini"] },
  { provider: "Google", models: ["Gemini 2.5 Flash", "Gemini 2.5 Pro"] },
  { provider: "DeepSeek", models: ["DeepSeek-R1", "DeepSeek-V3"] },
  { provider: "Image Studio", models: ["FLUX.1 Schnell"] },
];

interface Suggestion {
  icon: LucideIcon;
  title: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: PenLine,
    title: "ایده‌ی محتوا",
    prompt: "برای پیج طراحی محصول، سه ایده‌ی پست با لحن ساده و حرفه‌ای بنویس.",
  },
  {
    icon: ImageIcon,
    title: "تولید تصویر",
    prompt: "تصویری از یک غروب کوهستانی مه‌آلود با پالت خاکستری و مینیمال بساز.",
  },
  {
    icon: Code,
    title: "توضیح کد و برنامه",
    prompt: "یک هوک ساده‌ی React برای debounce بنویس و خط‌به‌خط توضیح بده.",
  },
  {
    icon: Lightbulb,
    title: "خلاصه‌سازی متن",
    prompt: "مهم‌ترین اصول طراحی سیستم‌های مقیاس‌پذیر هوش مصنوعی را در پنج خط خلاصه کن.",
  },
];

function ClaudeThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 py-3 text-foreground-3">
      <div className="relative flex items-center justify-center">
        <span className="relative flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/40 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-white/60" />
        </span>
      </div>
      <span className="animate-pulse text-[13px] font-medium tracking-wide text-foreground-2">
        در حال تفکر و پردازش پاسخ...
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
    <div className="my-2 max-w-xl overflow-hidden rounded-card border border-line bg-card">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={caption || "تصویر تولیدشده"}
          className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
      </div>
      {caption && (
        <div className="flex items-center justify-between border-t border-line/60 p-3 text-xs text-foreground-2">
          <span className="truncate">{caption}</span>
          <a
            href={imageUrl}
            download="arka-ai-image.svg"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-foreground-3 hover:bg-soft hover:text-foreground"
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

  // Selected Model
  const [model, setModel] = React.useState("Anthropic:Claude Sonnet 4");

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

  React.useEffect(() => {
    fetch("/api/user-providers")
      .then((res) => res.json())
      .then((data) => {
        setUserProviders(data.providers || []);
      })
      .catch(() => {});

    fetch("/api/site-providers")
      .then((res) => res.json())
      .then((data) => {
        setSiteProviders(data.providers || []);
      })
      .catch(() => {});
  }, []);

  const modelGroups: ModelGroup[] = React.useMemo(() => {
    const list: ModelGroup[] = [...BASE_MODEL_GROUPS];

    // Admin site providers
    for (const p of siteProviders) {
      const pModels = p.models
        ? p.models.split(",").map((m) => m.trim()).filter(Boolean)
        : ["Default Model"];
      list.push({
        provider: p.name,
        models: pModels,
        isSiteProvider: true,
        providerId: p.id,
      });
    }

    // User personal providers
    const connected = userProviders.filter((p) => p.status === "connected");
    for (const p of connected) {
      const pModels = p.models
        ? p.models.split(",").map((m) => m.trim()).filter(Boolean)
        : ["Default Model"];
      list.push({
        provider: p.name,
        models: pModels,
        isUserProvider: true,
        providerId: p.id,
      });
    }
    return list;
  }, [siteProviders, userProviders]);

  // Composer state
  const [input, setInput] = React.useState("");
  const [attachment, setAttachment] = React.useState<{ name: string; url: string } | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (!activeId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    fetch(`/api/conversations/${activeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setMessages(data.conversation?.messages || []);
      })
      .catch(() => {
        setMessages([]);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
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
    const filtered = q
      ? conversations.filter((c) => c.title.toLowerCase().includes(q))
      : conversations;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

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

  // Conversation Actions
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

  // Attachment upload simulation
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

  // Stop Streaming
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsThinking(false);
  };

  // Send Message with Streaming
  const handleSend = async (messageText?: string) => {
    if (user?.isBanned) return;
    if (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0) return;

    const textToSend = (messageText ?? input).trim();
    if (!textToSend && !attachment) return;
    if (isStreaming) return;

    const [selectedProviderName, selectedModelName] = model.split(":");
    const currentModelName = selectedModelName || model;
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
          conversationId: activeId || undefined,
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

      // Non-streaming image response
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

      // Streaming text response (SSE)
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      const assistantMsgId = `assistant-${Date.now()}`;
      let accumulatedText = "";
      let hasAddedAssistantMsg = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const eventData = JSON.parse(dataStr);

              if (eventData.type === "start") {
                setIsThinking(false);
                if (eventData.isNewConversation && eventData.conversationId) {
                  router.push(`/chat?id=${eventData.conversationId}`);
                  loadConversations();
                }
              } else if (eventData.type === "chunk") {
                setIsThinking(false);
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
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("Send error:", err);
        const errMsg = (err as Error)?.message || "متأسفانه در برقراری ارتباط با مدل خطایی رخ داد. لطفاً دوباره تلاش کنید.";
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
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground" dir="rtl">
      {/* ================= Right Sidebar (Fixed in screen) ================= */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex w-72 shrink-0 flex-col border-e border-line bg-[#0d0d0d] p-3 transition-transform duration-300 md:static md:w-80 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand & New Chat */}
        <div className="flex items-center justify-between pb-3">
          <Link href="/" className="flex items-center gap-2 px-1">
            <ArkaMark className="size-6 text-white" />
            <span dir="ltr" className="font-display text-[17px] font-bold tracking-tight text-white">
              ARKA
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChat}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="size-3.5" />
              گفتگوی جدید
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative my-2">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground-3" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در گفتگوها..."
            className="h-8 ps-8 text-xs bg-[#141414] border-line"
          />
        </div>

        {/* Scrollable Conversation List */}
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1">
          {conversationGroups.length > 0 ? (
            <SpotlightList
              groups={conversationGroups}
              activeId={activeId}
              onSelect={handleSelectConversation}
              onPin={handlePin}
              onRename={handleRename}
              onDelete={handleDelete}
              ariaLabel="فهرست گفتگوها"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-foreground-3">
              <p>گفتگویی وجود ندارد.</p>
              <button
                type="button"
                onClick={handleNewChat}
                className="mt-2 text-white underline hover:opacity-80"
              >
                شروع اولین گفتگو
              </button>
            </div>
          )}
        </div>

        {/* User profile footer inside sidebar for mobile fallback */}
        <div className="border-t border-line pt-2 md:hidden">
          <UserMenu
            name={user?.name || "کاربر ارکا"}
            subtitle={user?.email || "حساب گوگل"}
            avatarUrl={user?.avatarUrl}
          />
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= Main Chat Section ================= */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-line bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-4" />
            </Button>

            {/* Model Picker */}
            <ModelPicker
              groups={modelGroups}
              value={model}
              onChange={setModel}
              className="text-xs"
            />

            <span className="hidden text-xs text-foreground-3 sm:inline">
              {activeTitle ? `• ${activeTitle}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNewChat}
              className="hidden gap-1.5 text-xs text-foreground-2 hover:text-white sm:inline-flex"
            >
              <Plus className="size-3.5" />
              گفتگوی جدید
            </Button>

            {/* User Menu with Google profile + Logout */}
            <div className="w-44">
              <UserMenu
                name={user?.name || "کاربر ارکا"}
                subtitle={user?.email || "حساب گوگل"}
                avatarUrl={user?.avatarUrl}
              />
            </div>
          </div>
        </header>

        {/* Chat Messages Scroll View with top fade/blur */}
        <div
          ref={chatScrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_100%)]"
        >
          {messages.length === 0 && !isLoadingMessages ? (
            /* Welcome / Zero State */
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="mb-6 grid size-14 place-items-center rounded-2xl border border-line bg-card shadow-sm">
                <ArkaMark className="size-8 text-white" />
              </div>
              <h1 className="text-xl font-bold sm:text-2xl">
                سلام {user?.name ? `${user.name} عزیز` : ""}، چه کمکی از من برمی‌آید؟
              </h1>
              <p className="mt-2 text-xs leading-6 text-foreground-3 sm:text-sm">
                می‌توانید مدل موردنظرتان را از نوار بالا انتخاب کرده و پرسش، کد یا درخواست تصویر را بفرستید.
              </p>

              {/* Suggestions Grid */}
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => handleSend(item.prompt)}
                      className="group flex flex-col items-start rounded-card border border-line bg-card/60 p-4 text-start transition-all hover:border-white/30 hover:bg-card"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Icon className="size-4 text-foreground-2 group-hover:text-white" />
                        <span>{item.title}</span>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-5 text-foreground-3 group-hover:text-foreground-2">
                        {item.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">
              {messages.map((msg) => {
                const isUser = msg.role === "user";

                if (isUser) {
                  return (
                    <div key={msg.id} className="ms-auto flex max-w-[85%] flex-col items-end sm:max-w-[75%]">
                      <div className="rounded-card border border-white/10 bg-[#1c1c1c] px-4 py-3 text-start text-[14px] leading-7 text-white shadow-sm">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                }

                // Assistant Message (Full-width / Left-aligned, no heavy bubble)
                return (
                  <div key={msg.id} className="me-auto flex w-full flex-col items-start text-start">
                    <div className="mb-1.5 flex items-center gap-2">
                      <ArkaMark className="size-4 text-white/80" />
                      <span className="text-xs font-semibold text-foreground-2">ارکا</span>
                    </div>

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

              {/* Claude-style Thinking/Typing Pulse */}
              {isThinking && <ClaudeThinkingIndicator />}
            </div>
          )}
        </div>

        {/* ================= Composer (Unified Input Box) ================= */}
        <div className="shrink-0 border-t border-line/60 bg-background/95 p-3 backdrop-blur sm:p-4">
          <div className="mx-auto max-w-3xl">
            {/* Ban Banner */}
            {user?.isBanned && (
              <div className="mb-3 rounded-card border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
                <div className="flex items-center gap-2 font-bold text-red-400 text-sm mb-1">
                  <Ban className="size-4" />
                  <span>حساب شما مسدود شده است</span>
                </div>
                <p className="leading-5">
                  دسترسی شما به محیط چت و ارسال پیام به دلیل تصمیم مدیریت سیستم مسدود گردیده است.
                  {user.banReason && (
                    <span className="block mt-1.5 font-medium text-red-300">
                      علت مسدودسازی: {user.banReason}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Timeout Banner with Live Countdown */}
            {timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0 && (
              <div className="mb-3 rounded-card border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-300">شما موقتاً محدود شده‌اید.</span>
                    <span className="ms-1.5">
                      {Math.ceil(timeoutRemainingSeconds / 60)} دقیقه دیگر می‌توانید استفاده کنید.
                      {user?.timeoutReason && ` (علت: ${user.timeoutReason})`}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 font-mono text-xs font-bold bg-black/50 border border-amber-500/30 px-3 py-1 rounded-control text-amber-300" dir="ltr">
                  <span>زمان باقی‌مانده:</span>
                  <span>
                    {Math.floor(timeoutRemainingSeconds / 60)}:
                    {String(timeoutRemainingSeconds % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>
            )}

            {/* Attachment preview chip */}
            {attachment && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-control border border-line bg-card px-3 py-1 text-xs text-foreground-2">
                <Paperclip className="size-3.5 text-foreground-3" />
                <span className="max-w-[180px] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="rounded p-0.5 hover:bg-white/10"
                >
                  <X className="size-3 text-foreground-3" />
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
              className="relative flex items-end gap-2 rounded-card border border-line bg-card p-2 shadow-sm transition-colors focus-within:border-white/30"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,text/*,.pdf"
                onChange={handleFileChange}
              />

              {/* Single Unified Attachment Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))}
                onClick={() => fileInputRef.current?.click()}
                className="size-9 shrink-0 rounded-control text-foreground-3 hover:text-white"
                title="پیوست فایل یا تصویر"
              >
                <Paperclip className="size-4" />
              </Button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))}
                placeholder={
                  user?.isBanned
                    ? "حساب شما مسدود شده است. امکان ارسال پیام وجود ندارد."
                    : timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0
                      ? `شما موقتاً محدود شده‌اید (${Math.ceil(timeoutRemainingSeconds / 60)} دقیقه دیگر می‌توانید استفاده کنید)`
                      : "پیامی بنویسید یا برای تولید تصویر پرامپت وارد کنید... (Enter برای ارسال، Shift+Enter برای خط بعد)"
                }
                rows={1}
                className={cn(
                  "max-h-36 min-h-[38px] flex-1 resize-none bg-transparent py-2 text-[13.5px] leading-6 text-foreground placeholder:text-foreground-3 focus:outline-none",
                  (user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0)) &&
                    "opacity-50 cursor-not-allowed",
                )}
              />

              {/* Send or Stop Button */}
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleStop}
                  className="size-9 shrink-0 rounded-control bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  title="توقف تولید پاسخ"
                >
                  <Square className="size-4 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={
                    (!input.trim() && !attachment) ||
                    Boolean(user?.isBanned || (timeoutRemainingSeconds !== null && timeoutRemainingSeconds > 0))
                  }
                  className="size-9 shrink-0 rounded-control bg-white text-black hover:bg-neutral-200 disabled:opacity-40"
                  title="ارسال پیام"
                >
                  <ArrowUp className="size-4 stroke-[2.5]" />
                </Button>
              )}
            </form>

            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-foreground-3">
              <span>ارکا ممکن است اشتباه کند؛ اطلاعات مهم را بررسی کنید.</span>
              <span className="hidden sm:inline">مدل: {model.split(":")[1] || model}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-line border-t-white" />
        </div>
      }
    >
      <ChatContent />
    </React.Suspense>
  );
}
