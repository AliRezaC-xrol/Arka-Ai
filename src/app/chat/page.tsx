"use client";

import * as React from "react";
import { ArrowUp, Menu, Plus, Search, X } from "lucide-react";

import { ModelPicker, type ModelGroup } from "@/components/model-picker";
import { SpotlightList, type SpotlightEntry } from "@/components/spotlight-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Mock data — Phase 0 only (SPEC §11, Phase 0 acceptance). */
const CONVERSATIONS: SpotlightEntry[] = [
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

export default function ChatPage() {
  const [activeId, setActiveId] = React.useState(CONVERSATIONS[0].id);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [model, setModel] = React.useState("OpenAI:GPT-4o");

  const selectConversation = (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  };

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
        className={cn(
          "w-72 shrink-0 flex-col gap-4 border-line bg-elevated p-4",
          "max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-40 max-md:flex max-md:border-e",
          "max-md:transition-transform max-md:duration-300",
          "md:flex md:border-e",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:translate-x-full",
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

        <Button onClick={() => undefined} className="w-full">
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
            items={CONVERSATIONS}
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

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
          <div className="max-w-md text-center">
            <div
              aria-hidden
              className="mx-auto grid h-12 w-12 place-items-center rounded-card border border-line bg-card text-lg font-semibold text-foreground-2"
            >
              A
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
                  title="نمایشی — در فاز ۲ متصل می‌شود"
                  onClick={() => undefined}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 p-3 sm:p-4">
          <form
            onSubmit={(event) => event.preventDefault()}
            className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-card border border-line bg-card p-2"
          >
            <textarea
              rows={1}
              aria-label="متن پیام"
              placeholder="پیامی بنویسید…"
              className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-foreground-3"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="ارسال پیام"
              title="ارسال (نمایشی)"
              className="h-9 w-9"
            >
              <ArrowUp aria-hidden />
            </Button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-foreground-3">
            این صفحه در فاز ۰ صرفاً نمایشی است و به بک‌اند متصل نیست.
          </p>
        </div>
      </main>
    </div>
  );
}
