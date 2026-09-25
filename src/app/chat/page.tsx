"use client";

import * as React from "react";
import {
  ArrowUp,
  Check,
  Code,
  Copy,
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
import { ArkaMark } from "@/components/site-navbar";
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
  /** Display time (Persian digits). */
  time?: string;
}

function nowTime() {
  return new Date().toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Canned histories so selecting a conversation shows something real. */
const MOCK_THREADS: Record<string, ChatMessage[]> = {
  c1: [
    {
      id: "c1-m1",
      role: "user",
      time: "۱۰:۲۴",
      content:
        "برای پیج طراحی محصول، سه ایده‌ی پست بنویس که تعامل بالایی بگیرد.",
    },
    {
      id: "c1-m2",
      role: "assistant",
      time: "۱۰:۲۵",
      content:
        "۱. «قبل و بعد» — ری‌دیزاین واقعی را کنار نسخه‌ی قدیمی نشان بده.\n۲. «خطای رایج» — سه اشتباه رایج در طراحی فرم را با مثال باز کن.\n۳. «پشت صحنه» — یک صفحه را از اسکیس تا نسخه‌ی نهایی بساز.",
    },
  ],
  c2: [
    {
      id: "c2-m1",
      role: "user",
      time: "۱۰:۲۴",
      content: "مقاله‌ی ترنسفورمرها را در پنج خط خلاصه کن.",
    },
    {
      id: "c2-m2",
      role: "assistant",
      time: "۱۰:۲۵",
      content:
        "ترنسفورمرها به‌جای بازگشت، به «توجه» تکیه می‌کنند؛ هر توکن به همه‌ی توکن‌ها نگاه می‌کند. این موازی‌سازی آموزش را سریع‌تر می‌کند و کیفیت پاسخ‌های طولانی را بالاتر می‌برد. همین معماری، پایه‌ی تقریباً همه‌ی مدل‌های زبانی امروزی است.",
    },
  ],
  c3: [
    {
      id: "c3-m1",
      role: "user",
      time: "۱۰:۲۴",
      content: "این ایمیل را مودبانه‌تر ولی کوتاه‌تر بازنویسی کن.",
    },
    {
      id: "c3-m2",
      role: "assistant",
      time: "۱۰:۲۵",
      content:
        "«سلام، ممنون از پیگیریتان. فایل را بررسی کردم و دو نکته‌ی کوچک باقی مانده؛ اگر امروز اصلاح شود، فردا نهایی‌اش می‌کنیم. ممنون!»",
    },
  ],
};

MOCK_THREADS.c5 = [
  {
    id: "c5-m1",
    role: "user",
    time: "۱۶:۰۲",
    content:
      "این کوئری Prisma کند است. هر بار برای هر کاربر، گفتگوهایش را جدا می‌گیرم.\nچطور درستش کنم که فقط یک درخواست به دیتابیس برود؟\nجدول Conversation حدود ۲۰۰ هزار ردیف دارد.",
  },
  {
    id: "c5-m2",
    role: "assistant",
    time: "۱۶:۰۳",
    content:
      "مشکل همان N+1 است: برای هر کاربر یک کوئری جدا اجرا می‌شود. با include همه را در یک رفت‌وبرگشت بگیر و فقط ستون‌های لازم را select کن:\n\n```ts\nconst users = await prisma.user.findMany({\n  select: {\n    id: true,\n    conversations: {\n      select: { id: true, title: true },\n      orderBy: { updatedAt: \"desc\" },\n      take: 20,\n    },\n  },\n});\n```\n\nیک ایندکس روی (userId, updatedAt) هم اضافه کن تا مرتب‌سازی از ایندکس خوانده شود.",
  },
];

function genericThread(title: string): ChatMessage[] {
  return [
    { id: "g-m1", role: "user", content: title, time: "۰۹:۱۲" },
    {
      id: "g-m2",
      role: "assistant",
      time: "۰۹:۱۳",
      content:
        "این یک پاسخ نمایشی است. در نسخه‌ی نهایی، پاسخ واقعی مدل همین‌جا استریم می‌شود. از دکمه‌ی مدل داخل کادر نوشتن می‌توانی مدل دلخواهت را عوض کنی.",
    },
  ];
}

const MOCK_REPLY =
  "پاسخ نمایشی ثبت شد. در نسخه‌ی نهایی، جواب واقعی مدل همین‌جا کلمه‌به‌کلمه استریم می‌شود. تا آن موقع همه‌ی بخش‌های رابط، از انتخاب مدل تا تاریخچه‌ی گفتگو، دقیقاً مثل نسخه‌ی نهایی کار می‌کنند.";

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
    el.style.height = `${Math.min(el.scrollHeight, 208)}px`;
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
      time: nowTime(),
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
            { id: assistantId, role: "assistant", content: MOCK_REPLY, time: nowTime() },
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
          { id: assistantId, role: "assistant", content: "", time: nowTime() },
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
  const canSend = draft.trim().length > 0 && !busy;
  const activeTitle = conversations.find((c) => c.id === activeId)?.title;

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
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      {/* ================= Sidebar ================= */}
      <aside
        aria-label="فهرست گفتگوها"
        className={cn(
          "sidebar-bg w-72 shrink-0 flex-col gap-3.5 border-line p-4",
          "max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-40 max-md:flex max-md:border-e",
          "max-md:transition-transform max-md:duration-300 max-md:ease-(--motion-ease)",
          "md:flex md:border-e",
          sidebarOpen
            ? "max-md:translate-x-0"
            : "max-md:translate-x-full max-md:invisible",
        )}
      >
        <div className="flex items-center justify-between px-1">
          <span className="flex items-center gap-2"><ArkaMark className="size-6" /><span dir="ltr" className="font-display text-[17px] font-bold tracking-[-0.02em]">ARKA</span></span>
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

        <Button onClick={startNewChat} variant="outline" className="h-10 w-full justify-start bg-white">
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
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Same restrained glow language as the hero, dimmer. */}
        

        <header className="relative z-[1] flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="باز کردن فهرست گفتگوها"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu aria-hidden />
          </Button>
          <p className="min-w-0 truncate text-[14px] font-medium text-foreground-2">
            {activeTitle ?? "گفتگوی جدید"}
          </p>
        </header>

        {activeId === null ? (
          /* ---------- Welcome ---------- */
          <div className="relative z-[1] flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
            <div className="w-full max-w-2xl">
              <div aria-hidden className="icon-tile mx-auto grid size-14 place-items-center rounded-card">
                <Sparkles className="size-7" strokeWidth={1.75} />
              </div>
              <h1 className="mt-6 text-center text-[1.75rem] font-bold leading-[1.4] sm:text-[2.25rem]">
                امروز روی چه چیزی کار کنیم؟
              </h1>
              <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    type="button"
                    onClick={() => {
                      setDraft(suggestion.prompt);
                      requestAnimationFrame(() => composerRef.current?.focus());
                    }}
                    className="group flex items-start gap-3 rounded-card border border-line bg-white p-4 text-start transition-colors duration-150 hover:border-blue-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <suggestion.icon
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-blue"
                      strokeWidth={1.75}
                    />
                    <span>
                      <span className="block text-[14px] font-medium">{suggestion.title}</span>
                      <span className="mt-1 block text-[13px] leading-6 text-foreground-3">
                        {suggestion.prompt}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ---------- Messages ---------- */
          <div
            onScroll={onScroll}
            className="relative z-[1] min-h-0 flex-1 overflow-y-auto"
            aria-label={`گفتگو: ${activeTitle ?? ""}`}
          >
            <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-9 px-4 pb-10 pt-4 sm:px-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  /* Me: blue bubble on the START side (right in RTL), like every Persian messenger. */
                  <div key={message.id} className="flex flex-col items-start">
                    <div className="msg-text bubble-user max-w-[88%] whitespace-pre-wrap rounded-[18px] rounded-ss-md px-4 py-2.5 text-[15px] leading-[1.9] sm:max-w-[78%]">
                      {message.content}
                    </div>
                    {message.time && (
                      <time className="mt-1.5 ps-1 text-[11.5px] text-foreground-3">
                        {message.time}
                      </time>
                    )}
                  </div>
                ) : (
                  /* Assistant: card on the END side (left in RTL), avatar at the far edge. */
                  <div key={message.id} className="flex flex-row-reverse items-start gap-3">
                    <AssistantAvatar />
                    <div className="min-w-0 max-w-[88%] rounded-[18px] rounded-se-md border border-line bg-[#f7f7f7] px-4 py-3 sm:max-w-[82%]">
                      <MessageContent
                        content={message.content}
                        streaming={streamingId === message.id}
                      />
                      {message.time && streamingId !== message.id && (
                        <time className="mt-1 block text-[11.5px] text-foreground-3">
                          {message.time}
                        </time>
                      )}
                    </div>
                  </div>
                ),
              )}

              {pendingFor === activeId && (
                <div className="flex flex-row-reverse items-center gap-3">
                  <AssistantAvatar thinking />
                  <span className="thinking-text text-[14px] font-medium">
                    در حال فکر کردن…
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden />
            </div>
          </div>
        )}

        {/* ---------- Composer ---------- */}
        <div className="relative z-[1] shrink-0 px-3 pb-3 sm:px-6 sm:pb-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="composer-ring mx-auto w-full max-w-[46rem] rounded-[20px] p-3"
          >
            <textarea
              ref={composerRef}
              rows={1}
              aria-label="متن پیام"
              placeholder="پیامت را بنویس…"
              value={draft}
              dir="auto"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              className="block max-h-52 min-h-[2.75rem] w-full resize-none bg-transparent px-2 pb-1 pt-1.5 text-[15px] leading-7 text-foreground outline-none placeholder:text-foreground-3 [text-align:start]"
            />
            <div className="mt-1.5 flex items-center gap-1.5">
              <button
                type="button"
                aria-label="پیوست فایل (به‌زودی)"
                title="پیوست فایل (به‌زودی)"
                className="grid size-8 place-items-center rounded-control text-foreground-3 transition-colors duration-150 hover:bg-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Paperclip aria-hidden className="size-4" />
              </button>
              <ModelPicker groups={MODEL_GROUPS} value={model} onChange={setModel} />
              <button
                type="submit"
                aria-label="ارسال پیام"
                title={`ارسال با ${currentModelLabel} (Enter)، خط جدید با Shift+Enter`}
                data-ready={canSend}
                aria-disabled={!canSend}
                className={cn(
                  "ms-auto grid size-10 shrink-0 place-items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  canSend ? "btn-blue" : "cursor-not-allowed border border-line bg-soft text-foreground-3",
                )}
              >
                <ArrowUp aria-hidden className="size-[18px]" strokeWidth={2.25} />
              </button>
            </div>
          </form>
          <p className="mx-auto mt-2 max-w-[46rem] text-center text-[11.5px] text-foreground-3">
            پاسخ‌ها در این نسخه‌ی نمایشی ساختگی هستند.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Message rendering                                                   */
/* ------------------------------------------------------------------ */

function AssistantAvatar({ thinking = false }: { thinking?: boolean }) {
  return (
    <div
      aria-hidden
      className="orb grid size-8 shrink-0 place-items-center rounded-full text-white"
    >
      {thinking ? <span className="thinking-orb" /> : <Sparkles className="size-4" strokeWidth={1.75} />}
    </div>
  );
}

type Segment = { kind: "text"; value: string } | { kind: "code"; lang: string; value: string };

/** Split a message on ``` fences. An unterminated fence (mid-stream) is
 *  rendered as code too, so streaming never flashes raw backticks. */
function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  const parts = content.split("```");
  parts.forEach((part, index) => {
    if (index % 2 === 0) {
      if (part.trim()) segments.push({ kind: "text", value: part.trim() });
    } else {
      const newline = part.indexOf("\n");
      const lang = newline === -1 ? part.trim() : part.slice(0, newline).trim();
      const value = newline === -1 ? "" : part.slice(newline + 1).replace(/\n$/, "");
      segments.push({ kind: "code", lang, value });
    }
  });
  return segments;
}

function MessageContent({ content, streaming }: { content: string; streaming: boolean }) {
  const segments = parseSegments(content);
  return (
    <div className="space-y-4 text-[15px] leading-[2] text-foreground">
      {segments.map((segment, index) =>
        segment.kind === "text" ? (
          <p key={index} className="msg-text whitespace-pre-wrap">
            {segment.value}
            {streaming && index === segments.length - 1 && <Caret />}
          </p>
        ) : (
          <CodeBlock key={index} lang={segment.lang} code={segment.value} />
        ),
      )}
      {streaming && (segments.length === 0 || segments[segments.length - 1].kind === "code") && (
        <p>
          <Caret />
        </p>
      )}
    </div>
  );
}

function Caret() {
  return (
    <span
      aria-hidden
      className="caret ms-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.2em] rounded-full bg-blue"
    />
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for non-secure contexts.
      const area = document.createElement("textarea");
      area.value = code;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="overflow-hidden rounded-[12px] border border-line bg-background">
      <div className="flex h-10 items-center justify-between border-b border-line ps-4 pe-1.5">
        <span dir="ltr" className="font-mono text-[12px] text-foreground-3">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "کپی شد" : "کپی کد"}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-control px-2 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            copied ? "text-blue" : "text-foreground-3 hover:bg-soft hover:text-foreground",
          )}
        >
          {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
          {copied ? "کپی شد" : "کپی"}
        </button>
      </div>
      <pre dir="ltr" className="overflow-x-auto p-4 text-left font-mono text-[13px] leading-6 text-foreground">
        <code>{code}</code>
      </pre>
      <span aria-live="polite" className="sr-only">
        {copied ? "کد کپی شد" : ""}
      </span>
    </div>
  );
}
