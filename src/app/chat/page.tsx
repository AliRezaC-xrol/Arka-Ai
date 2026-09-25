"use client";

import * as React from "react";
import {
  ArrowUp,
  Image as ImageIcon,
  Menu,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { ModelPicker, type ModelGroup } from "@/components/model-picker";
import { SpotlightList, type SpotlightEntry } from "@/components/spotlight-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Mock data — Phase 0 only (SPEC §11, Phase 0 acceptance). */
const INITIAL_CONVERSATIONS: SpotlightEntry[] = [
  { id: "c1", title: "ایده‌های محتوای اینستاگرام", meta: "۲ ساعت پیش" },
  { id: "c2", title: "خلاصه‌ی مقاله‌ی ترنسفورمرها", meta: "دیروز" },
  { id: "c3", title: "بازنویسی ایمیل به مشتری", meta: "دیروز" },
  { id: "c4", title: "برنامه‌ی سفر سه‌روزه به استانبول", meta: "۳ روز پیش" },
  { id: "c5", title: "بهینه‌سازی کوئری‌های Prisma", meta: "هفته‌ی پیش" },
  { id: "c6", title: "تمرین مصاحبه‌ی فرانت‌اند", meta: "هفته‌ی پیش" },
  { id: "c7", title: "ترجمه‌ی قرارداد اجاره", meta: "ماه پیش" },
];

const MODEL_GROUPS: ModelGroup[] = [
  { provider: "OpenAI", models: ["GPT-4o", "GPT-4o mini"] },
  { provider: "Anthropic", models: ["Claude Sonnet 4"] },
  { provider: "Google", models: ["Gemini 2.5 Flash"] },
];

const SUGGESTIONS = [
  "یک ایده‌ی محتوایی بده",
  "کد React را توضیح بده",
  "تصویری از یک غروب بساز",
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
      content: "برای پیج طراحی محصول، سه ایده‌ی پست بنویس که تعامل بالایی بگیرد.",
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
        "ترنسفورمرها به‌جای بازگشت، به «توجه» تکیه می‌کنند؛ هر توکن به همه‌ی توکن‌ها نگاه می‌کند. این موازی‌سازی آموزش را سریع‌تر می‌کند و کیفیت طولانی‌ترها را بالاتر می‌برد. معماری پایه‌ی تقریباً همه‌ی مدل‌های زبانی امروزی است.",
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
        "این یک پاسخ نمایشی است — در فاز ۲ به مدل واقعی وصل می‌شود. از انتخابگر بالای صفحه مدل دلخواهت را عوض کن.",
    },
  ];
}

const MOCK_REPLY =
  "پاسخ نمایشی ثبت شد. در فاز ۲ همین‌جا استریم واقعی مدل را می‌بینی — کلمه‌به‌کلمه، بدون رفرش.";

export default function ChatPage() {
  const [conversations, setConversations] =
    React.useState<SpotlightEntry[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = React.useState<string | null>("c1");
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
  const [pendingReply, setPendingReply] = React.useState(false);

  const composerRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const replyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const idCounter = React.useRef(0);

  const messages = activeId ? (threads[activeId] ?? []) : [];

  /* Auto-resize the composer: height = content, capped at max-h. */
  React.useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  /* Keep the newest message in view. */
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pendingReply]);

  /* Escape closes the mobile sidebar. */
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  /* Clean up the mock-reply timer on unmount. */
  React.useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
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

  const sendMessage = (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text || pendingReply) return;

    const isNewThread = activeId === null;
    const threadId = activeId ?? `draft-${++idCounter.current}`;
    if (isNewThread) {
      // First message of a fresh chat: create a sidebar entry for it.
      const title = text.length > 26 ? `${text.slice(0, 26)}…` : text;
      setConversations((prev) => [{ id: threadId, title, meta: "همین حالا" }, ...prev]);
    }

    const userMessage: ChatMessage = {
      id: `u-${++idCounter.current}`,
      role: "user",
      content: text,
    };
    setThreads((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), userMessage],
    }));
    setActiveId(threadId);
    setDraft("");
    setPendingReply(true);

    replyTimer.current = setTimeout(() => {
      setThreads((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] ?? []),
          { id: `a-${++idCounter.current}`, role: "assistant", content: MOCK_REPLY },
        ],
      }));
      setPendingReply(false);
    }, 900);
  };

  const currentModelLabel = model.split(":")[1] ?? "مدل";

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="فهرست گفتگوها"
        className={cn(
          "w-72 shrink-0 flex-col gap-4 border-line bg-elevated p-4",
          "max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-40 max-md:flex max-md:border-e",
          "max-md:transition-transform max-md:duration-300 max-md:ease-(--motion-ease)",
          "md:flex md:border-e",
          sidebarOpen
            ? "max-md:translate-x-0"
            : "max-md:translate-x-full max-md:invisible",
        )}
      >
        <div className="flex items-center justify-between">
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
          <input
            type="search"
            aria-label="جستجو در گفتگوها"
            placeholder="جستجو…"
            className="h-10 w-full rounded-control border border-line bg-transparent ps-9 pe-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-foreground-3 hover:border-white/20 focus-visible:border-white/40"
          />
        </div>

        <p className="text-[11px] font-medium text-foreground-3">گفتگوها</p>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <SpotlightList
            items={conversations}
            activeId={activeId}
            onSelect={selectConversation}
            ariaLabel="تاریخچه‌ی گفتگوها"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <div
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-xs text-foreground-2"
          >
            م
          </div>
          <div className="min-w-0 leading-5">
            <p className="truncate text-[13px] text-foreground">کاربر مهمان</p>
            <p className="text-[11px] text-foreground-3">ورود نمایشی</p>
          </div>
        </div>
      </aside>

      {/* Main column */}
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
            فاز ۰ · نسخه‌ی نمایشی
          </span>
        </header>

        {/* Message area / welcome state */}
        {activeId === null && messages.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
            <div className="max-w-md text-center">
              <div
                aria-hidden
                className="mx-auto grid size-12 place-items-center rounded-card border border-line bg-card text-foreground-2"
              >
                <Sparkles className="size-5" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-lg font-semibold">گفتگوی جدید</h1>
              <p className="mt-2 text-[13px] leading-7 text-foreground-2">
                سؤالت را بپرس، یا مدل مورد نظرت را از بالای صفحه انتخاب کن.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDraft(suggestion);
                      composerRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            aria-live="polite"
            aria-label={`گفتگو: ${conversations.find((c) => c.id === activeId)?.title ?? ""}`}
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-start" : "justify-end",
                  )}
                >
                  {message.role === "user" && (
                    <div
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-[11px] text-foreground-2"
                    >
                      م
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-card px-4 py-3 text-[13px] leading-7 sm:max-w-[75%]",
                      message.role === "user"
                        ? "rounded-ss-sm border border-line bg-card text-foreground"
                        : "rounded-se-sm border border-line bg-elevated text-foreground-2",
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "assistant" && (
                    <div
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-foreground-2"
                    >
                      <Sparkles className="size-4" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ))}

              {pendingReply && (
                <div className="flex justify-end gap-3">
                  <div className="rounded-card rounded-se-sm border border-line bg-elevated px-4 py-3.5">
                    <div className="flex gap-1.5" aria-hidden>
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:0ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:300ms]" />
                    </div>
                    <span className="sr-only">دستیار در حال نوشتن است</span>
                  </div>
                  <div
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-foreground-2"
                  >
                    <Sparkles className="size-4" strokeWidth={1.5} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden />
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="shrink-0 p-3 sm:p-4">
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
              title="پیوست فایل — در فاز ۲ فعال می‌شود"
              className="shrink-0 text-foreground-3 hover:text-foreground"
              onClick={(event) => event.preventDefault()}
            >
              <Paperclip aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="تولید تصویر (نمایشی)"
              title="تولید تصویر — در فاز ۳ فعال می‌شود"
              className="hidden shrink-0 text-foreground-3 hover:text-foreground sm:inline-flex"
              onClick={(event) => event.preventDefault()}
            >
              <ImageIcon aria-hidden />
            </Button>
            <textarea
              ref={composerRef}
              rows={1}
              aria-label="متن پیام"
              placeholder="پیامی بنویسید…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
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
              title={`ارسال — ${currentModelLabel} (نمایشی)`}
              disabled={!draft.trim() || pendingReply}
              className="shrink-0"
            >
              <ArrowUp aria-hidden />
            </Button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-foreground-3">
            این صفحه در فاز ۰ نمایشی است؛ Enter ارسال، Shift+Enter خط جدید.
          </p>
        </div>
      </main>
    </div>
  );
}
