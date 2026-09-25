"use client";

import * as React from "react";
import {
  ArrowUp,
  Code,
  Image as ImageIcon,
  Lightbulb,
  Menu,
  Paperclip,
  PenLine,
  Plus,
  Search,
  Sparkles,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Mock data — Phase 0 only (SPEC §11). No real backend anywhere.      */
/* ------------------------------------------------------------------ */

type Bucket = "today" | "yesterday" | "week" | "month";

interface Conversation extends SpotlightEntry {
  bucket: Bucket;
}

const BUCKET_ORDER: Bucket[] = ["today", "yesterday", "week", "month"];

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "امروز",
  yesterday: "دیروز",
  week: "۷ روز گذشته",
  month: "۳۰ روز گذشته",
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: "c1", title: "ایده‌های محتوای اینستاگرام", bucket: "today" },
  { id: "c2", title: "خلاصه‌ی مقاله‌ی ترنسفورمرها", bucket: "yesterday" },
  { id: "c3", title: "بازنویسی ایمیل به مشتری", bucket: "yesterday" },
  { id: "c4", title: "برنامه‌ی سفر سه‌روزه به استانبول", bucket: "week" },
  { id: "c5", title: "بهینه‌سازی کوئری‌های Prisma", bucket: "week" },
  { id: "c6", title: "تمرین مصاحبه‌ی فرانت‌اند", bucket: "week" },
  { id: "c7", title: "ترجمه‌ی قرارداد اجاره", bucket: "month" },
];

const MODEL_GROUPS: ModelGroup[] = [
  { provider: "OpenAI", models: ["GPT-4o", "GPT-4o mini"] },
  { provider: "Anthropic", models: ["Claude Sonnet 4"] },
  { provider: "Google", models: ["Gemini 2.5 Flash"] },
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
    prompt: "تصویری از یک غروب کوهستانی مه‌آلود با پالت خاکستری بساز.",
  },
  {
    icon: Code,
    title: "توضیح کد",
    prompt: "یک هوک ساده‌ی React برای debounce بنویس و خط‌به‌خط توضیح بده.",
  },
  {
    icon: Lightbulb,
    title: "خلاصه‌سازی",
    prompt: "مقاله‌ی طولانی من را در پنج خط خلاصه کن.",
  },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** Canned histories so selecting a conversation shows something real. */
const MOCK_THREADS: Record<string, ChatMessage[]> = {
  c1: [
    {
      id: "c1-m1",
      role: "user",
      content:
        "برای پیج طراحی محصول، سه ایده‌ی پست بنویس که تعامل بالایی بگیرد.",
    },
    {
      id: "c1-m2",
      role: "assistant",
      content:
        "۱. «قبل و بعد» — ری‌دیزاین واقعی را کنار نسخه‌ی قدیمی نشان بده.\n۲. «خطای رایج» — سه اشتباه رایج در طراحی فرم را با مثال باز کن.\n۳. «پشت صحنه» — یک صفحه را از اسکیس تا نسخه‌ی نهایی بساز.",
    },
  ],
  c2: [
    {
      id: "c2-m1",
      role: "user",
      content: "مقاله‌ی ترنسفورمرها را در پنج خط خلاصه کن.",
    },
    {
      id: "c2-m2",
      role: "assistant",
      content:
        "ترنسفورمرها به‌جای بازگشت، به «توجه» تکیه می‌کنند؛ هر توکن به همه‌ی توکن‌ها نگاه می‌کند. این موازی‌سازی آموزش را سریع‌تر می‌کند و کیفیت پاسخ‌های طولانی را بالاتر می‌برد. همین معماری، پایه‌ی تقریباً همه‌ی مدل‌های زبانی امروزی است.",
    },
  ],
  c3: [
    {
      id: "c3-m1",
      role: "user",
      content: "این ایمیل را مودبانه‌تر ولی کوتاه‌تر بازنویسی کن.",
    },
    {
      id: "c3-m2",
      role: "assistant",
      content:
        "«سلام، ممنون از پیگیریتان. فایل را بررسی کردم و دو نکته‌ی کوچک باقی مانده؛ اگر امروز اصلاح شود، فردا نهایی‌اش می‌کنیم. ممنون!»",
    },
  ],
};

function genericThread(title: string): ChatMessage[] {
  return [
    { id: "g-m1", role: "user", content: title },
    {
      id: "g-m2",
      role: "assistant",
      content:
        "این یک پاسخ نمایشی است — در نسخه‌ی نهایی، پاسخ واقعی مدل همین‌جا استریم می‌شود. از انتخابگر بالای صفحه می‌توانی مدل دلخواهت را عوض کنی.",
    },
  ];
}

const MOCK_REPLY =
  "پاسخ نمایشی ثبت شد — در نسخه‌ی نهایی، جواب واقعی مدل همین‌جا کلمه‌به‌کلمه استریم می‌شود. تا آن موقع همه‌ی بخش‌های رابط، از انتخاب مدل تا تاریخچه‌ی گفتگو، دقیقاً مثل نسخه‌ی نهایی کار می‌کنند.";

/** Stable empty reference so the auto-scroll effect never loop-fires. */
const EMPTY_MESSAGES: ChatMessage[] = [];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ChatPage() {
  const [conversations, setConversations] =
    React.useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = React.useState<string | null>("c1");
  const [query, setQuery] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [model, setModel] = React.useState("OpenAI:GPT-4o");

  const [threads, setThreads] = React.useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    for (const conversation of INITIAL_CONVERSATIONS) {
      initial[conversation.id] =
        MOCK_THREADS[conversation.id] ?? genericThread(conversation.title);
    }
    return initial;
  });
  const [draft, setDraft] = React.useState("");
  /** Thread currently waiting for the (mock) reply to start. */
  const [pendingFor, setPendingFor] = React.useState<string | null>(null);
  /** Assistant message currently being revealed word by word. */
  const [streamingId, setStreamingId] = React.useState<string | null>(null);
  /** Short status for screen readers (announced once per phase change). */
  const [liveStatus, setLiveStatus] = React.useState("");

  const composerRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const replyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const idCounter = React.useRef(0);
  /** Only auto-scroll while the user is (still) near the bottom. */
  const nearBottomRef = React.useRef(true);

  const messages = React.useMemo(
    () => (activeId ? (threads[activeId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES),
    [activeId, threads],
  );
  const busy = pendingFor !== null || streamingId !== null;

  /* Sidebar search → grouped, filtered conversation list. */
  const trimmedQuery = query.trim();
  const visibleConversations = trimmedQuery
    ? conversations.filter((conversation) =>
        conversation.title.includes(trimmedQuery),
      )
    : conversations;
  const groups: SpotlightGroup[] = BUCKET_ORDER.map((bucket) => ({
    label: BUCKET_LABELS[bucket],
    items: visibleConversations.filter(
      (conversation) => conversation.bucket === bucket,
    ),
  })).filter((group) => group.items.length > 0);

  /* Auto-resize the composer: height = content, capped at max-h. */
  React.useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  /* Switching threads: always start pinned to the newest message. */
  React.useEffect(() => {
    nearBottomRef.current = true;
  }, [activeId]);

  /* Keep the newest message in view (only while the user is near the bottom,
     so reading history is never hijacked by the mock stream). */
  React.useEffect(() => {
    if (nearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages, pendingFor]);

  /* Escape closes the mobile sidebar. */
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  /* Clean up mock-stream timers on unmount. */
  React.useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
      if (streamTimer.current) clearInterval(streamTimer.current);
    };
  }, []);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  };

  const startNewChat = () => {
    setActiveId(null);
    setSidebarOpen(false);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  };

  const sendMessage = (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text || busy) return;

    const isNewThread = activeId === null;
    const threadId = activeId ?? `draft-${++idCounter.current}`;
    if (isNewThread) {
      // First message of a fresh chat: create a sidebar entry for it.
      const title = text.length > 26 ? `${text.slice(0, 26)}…` : text;
      setConversations((prev) => [
        { id: threadId, title, bucket: "today" },
        ...prev,
      ]);
    }

    const userMessage: ChatMessage = {
      id: `u-${++idCounter.current}`,
      role: "user",
      content: text,
    };
    const assistantId = `a-${++idCounter.current}`;

    setThreads((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), userMessage],
    }));
    setActiveId(threadId);
    setDraft("");
    setPendingFor(threadId);
    setLiveStatus("دستیار در حال نوشتن است");

    replyTimer.current = setTimeout(() => {
      setPendingFor(null);

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        // No motion: the reply appears in full, instantly.
        setThreads((prev) => ({
          ...prev,
          [threadId]: [
            ...(prev[threadId] ?? []),
            { id: assistantId, role: "assistant", content: MOCK_REPLY },
          ],
        }));
        setLiveStatus("دستیار پاسخ داد");
        return;
      }

      // Add an empty assistant message, then reveal it word by word —
      // the same feel as a real streamed response.
      setThreads((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] ?? []),
          { id: assistantId, role: "assistant", content: "" },
        ],
      }));
      setStreamingId(assistantId);

      const words = MOCK_REPLY.split(" ");
      let shown = 0;
      streamTimer.current = setInterval(() => {
        shown += 1;
        const partial = words.slice(0, shown).join(" ");
        setThreads((prev) => ({
          ...prev,
          [threadId]: (prev[threadId] ?? []).map((message) =>
            message.id === assistantId
              ? { ...message, content: partial }
              : message,
          ),
        }));
        if (shown >= words.length) {
          if (streamTimer.current) clearInterval(streamTimer.current);
          setStreamingId(null);
          setLiveStatus("دستیار پاسخ داد");
        }
      }, 55);
    }, 700);
  };

  const currentModelLabel = model.split(":")[1] ?? "مدل";

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Screen-reader status for the mock reply lifecycle */}
      <p aria-live="polite" role="status" className="sr-only">
        {liveStatus}
      </p>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      {/* ================= Sidebar ================= */}
      <aside
        aria-label="فهرست گفتگوها"
        className={cn(
          "w-72 shrink-0 flex-col gap-3.5 border-line bg-elevated p-4",
          "max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-40 max-md:flex max-md:border-e",
          "max-md:transition-transform max-md:duration-300 max-md:ease-(--motion-ease)",
          "md:flex md:border-e",
          sidebarOpen
            ? "max-md:translate-x-0"
            : "max-md:translate-x-full max-md:invisible",
        )}
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-[15px] font-semibold tracking-tight">Arka</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="بستن فهرست گفتگوها"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X aria-hidden />
          </Button>
        </div>

        <Button onClick={startNewChat} className="w-full">
          <Plus aria-hidden />
          گفتگوی جدید
        </Button>

        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground-3"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="جستجو در گفتگوها"
            placeholder="جستجو در گفتگوها…"
            className="ps-9"
          />
        </div>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {groups.length > 0 ? (
            <SpotlightList
              groups={groups}
              activeId={activeId}
              onSelect={selectConversation}
              ariaLabel="تاریخچه‌ی گفتگوها"
            />
          ) : (
            <p className="px-3 py-6 text-center text-[12px] text-foreground-3">
              گفتگویی پیدا نشد.
            </p>
          )}
        </div>

        <div className="border-t border-line pt-2">
          <UserMenu name="کاربر مهمان" subtitle="ورود نمایشی" />
        </div>
      </aside>

      {/* ================= Main column ================= */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="باز کردن فهرست گفتگوها"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu aria-hidden />
          </Button>
          <ModelPicker groups={MODEL_GROUPS} value={model} onChange={setModel} />
          <span className="ms-auto hidden rounded-full border border-line px-2.5 py-1 text-[11px] text-foreground-3 sm:inline-flex">
            نسخه‌ی نمایشی
          </span>
        </header>

        {/* ---------- Welcome / empty state ---------- */}
        {activeId === null ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
            <div className="w-full max-w-lg text-center">
              <div
                aria-hidden
                className="mx-auto grid size-14 place-items-center rounded-card border border-line bg-card"
              >
                <Sparkles
                  className="size-6 text-foreground-2"
                  strokeWidth={1.5}
                />
              </div>
              <h1 className="mt-5 text-xl font-semibold">
                چطور می‌تونم کمکت کنم؟
              </h1>
              <p className="mt-2 text-[13px] leading-7 text-foreground-2">
                سؤالت را بنویس یا یکی از پیشنهادهای زیر را انتخاب کن.
              </p>

              <div className="mt-7 grid gap-3 text-start sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    type="button"
                    onClick={() => {
                      setDraft(suggestion.prompt);
                      requestAnimationFrame(() =>
                        composerRef.current?.focus(),
                      );
                    }}
                    className="group rounded-card border border-line bg-card p-4 transition-[border-color,transform] duration-200 ease-(--motion-ease) hover:-translate-y-0.5 hover:border-white/20 focus-visible:border-white/40 focus-visible:outline-none"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-control border border-line bg-elevated text-foreground-2 transition-colors duration-200 group-hover:text-foreground">
                        <suggestion.icon
                          aria-hidden
                          className="size-4"
                          strokeWidth={1.5}
                        />
                      </span>
                      <span className="text-[13px] font-medium text-foreground">
                        {suggestion.title}
                      </span>
                    </span>
                    <span className="mt-2.5 block text-xs leading-6 text-foreground-3">
                      {suggestion.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ---------- Message list ---------- */
          <div
            onScroll={onScroll}
            className="min-h-0 flex-1 overflow-y-auto"
            aria-label={`گفتگو: ${conversations.find((c) => c.id === activeId)?.title ?? ""}`}
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
              {messages.map((message) =>
                message.role === "user" ? (
                  /* User turn: quiet bubble on the far side (end). */
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-card rounded-es-sm border border-line bg-card px-4 py-3 text-sm leading-7 text-foreground sm:max-w-[75%]">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant turn: open full-width text from the reading
                     edge (claude.ai-style), no bubble. */
                  <div key={message.id} className="flex gap-3">
                    <div
                      aria-hidden
                      className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-elevated text-foreground-2"
                    >
                      <Sparkles className="size-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-foreground-3">ارکا</p>
                      <div className="mt-0.5 whitespace-pre-wrap text-sm leading-8 text-foreground">
                        {message.content}
                        {streamingId === message.id && (
                          <span
                            aria-hidden
                            className="ms-1 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse rounded-full bg-foreground-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}

              {/* Typing indicator (before the mock reply starts) */}
              {pendingFor === activeId && (
                <div className="flex gap-3">
                  <div
                    aria-hidden
                    className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-elevated text-foreground-2"
                  >
                    <Sparkles className="size-4" strokeWidth={1.5} />
                  </div>
                  <div
                    className="flex w-fit items-center gap-1.5 rounded-card border border-line bg-card px-4 py-3.5"
                    aria-hidden
                  >
                    <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden />
            </div>
          </div>
        )}

        {/* ---------- Composer ---------- */}
        <div className="shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="mx-auto flex w-full max-w-3xl items-end gap-1.5 rounded-card border border-line bg-card p-2 transition-colors duration-200 focus-within:border-white/25"
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="پیوست فایل (نمایشی)"
              title="پیوست فایل — به‌زودی"
              className="shrink-0 text-foreground-3 hover:text-foreground"
              onClick={(event) => event.preventDefault()}
            >
              <Paperclip aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="تولید تصویر (نمایشی)"
              title="تولید تصویر — به‌زودی"
              className="hidden shrink-0 text-foreground-3 hover:text-foreground sm:inline-flex"
              onClick={(event) => event.preventDefault()}
            >
              <ImageIcon aria-hidden />
            </Button>
            <textarea
              ref={composerRef}
              rows={1}
              aria-label="متن پیام"
              placeholder="پیامت را بنویس…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              className="max-h-40 min-w-0 flex-1 resize-none self-center bg-transparent px-2 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground-3"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="ارسال پیام"
              title={`ارسال (Enter) — خط جدید: Shift+Enter — مدل: ${currentModelLabel}`}
              disabled={!draft.trim() || busy}
              className="shrink-0"
            >
              <ArrowUp aria-hidden />
            </Button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-foreground-3">
            پاسخ‌ها در این نسخه‌ی نمایشی ساختگی هستند.
          </p>
        </div>
      </main>
    </div>
  );
}
