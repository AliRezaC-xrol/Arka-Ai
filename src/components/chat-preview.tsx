import { ArrowUp, Image as ImageIcon, Mic, Paperclip, Sparkles } from "lucide-react";

/**
 * Static, simplified illustration of the Arka chat interface used on the
 * marketing page. Pure JSX/CSS — no interactivity, no client JS. Mirrors
 * the real app shell (sidebar / messages / composer) with the same tokens.
 */
export function ChatPreview() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-card border border-line bg-elevated text-start"
    >
      {/* App chrome */}
      <div className="flex h-9 items-center gap-1.5 border-b border-line bg-card px-4">
        <span className="size-2 rounded-full border border-line bg-elevated" />
        <span className="size-2 rounded-full border border-line bg-elevated" />
        <span className="size-2 rounded-full border border-line bg-elevated" />
        <span className="mx-auto flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[10px] text-foreground-3">
          arka.app/chat
        </span>
      </div>

      <div className="flex h-[340px] sm:h-[380px]">
        {/* Mini sidebar */}
        <div className="hidden w-44 shrink-0 flex-col gap-2 border-e border-line bg-background p-3 sm:flex">
          <span className="px-1 text-[11px] font-semibold tracking-tight text-foreground">
            Arka
          </span>
          <div className="rounded-control bg-soft p-2.5">
            <p className="truncate text-[11px] font-medium text-foreground">
              ایده‌های محتوای اینستاگرام
            </p>
            <p className="mt-0.5 text-[9px] text-foreground-3">۲ ساعت پیش</p>
          </div>
          {["خلاصه‌ی مقاله‌ی ترنسفورمرها", "بازنویسی ایمیل به مشتری", "برنامه‌ی سفر به استانبول"].map(
            (title) => (
              <div key={title} className="rounded-control p-2.5">
                <p className="truncate text-[11px] text-foreground-2">{title}</p>
                <p className="mt-0.5 text-[9px] text-foreground-3">دیروز</p>
              </div>
            ),
          )}
          <div className="mt-auto flex items-center gap-2 border-t border-line pt-2.5">
            <span className="grid size-6 place-items-center rounded-full border border-line text-[9px] text-foreground-2">
              م
            </span>
            <span className="text-[10px] text-foreground-2">کاربر مهمان</span>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-3">
            <Sparkles className="size-3 text-foreground-3" />
            <span className="text-[11px] text-foreground-2">OpenAI · GPT-4o</span>
            <span className="ms-auto hidden rounded-full border border-line px-2 py-0.5 text-[9px] text-foreground-3 sm:inline">
              پاسخ استریمی
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 p-3 sm:p-4">
            {/* User bubble */}
            <div className="flex justify-start gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-[9px] text-foreground-2">
                م
              </span>
              <div className="max-w-[80%] rounded-card rounded-ss-sm border border-line bg-card px-3 py-2 text-[11px] leading-5 text-foreground">
                سه ایده‌ی پست برای پیج طراحی محصول بنویس؛ لحن ساده و حرفه‌ای.
              </div>
            </div>
            {/* Assistant streaming bubble */}
            <div className="flex justify-end gap-2">
              <div className="max-w-[85%] rounded-card rounded-se-sm border border-line bg-elevated px-3 py-2 text-[11px] leading-5 text-foreground-2">
                <p className="font-medium text-foreground">۱. قبل و بعد</p>
                <p className="mt-1">
                  یک ری‌دیزاین واقعی را کنار نسخه‌ی قدیمی نشان بده؛ متن کوتاه، تصویر قهرمان…
                </p>
                <div className="mt-2 flex gap-1.5" aria-hidden>
                  <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:300ms]" />
                </div>
              </div>
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-foreground-2">
                <Sparkles className="size-3" />
              </span>
            </div>
          </div>

          {/* Mini composer */}
          <div className="shrink-0 p-3 pt-0">
            <div className="mx-auto flex max-w-md items-center gap-2 rounded-card border border-line bg-card p-2">
              <Paperclip className="size-3.5 text-foreground-3" />
              <span className="min-w-0 flex-1 truncate text-[11px] text-foreground-3">
                پیامی بنویسید…
              </span>
              <ImageIcon className="hidden size-3.5 text-foreground-3 sm:block" />
              <Mic className="hidden size-3.5 text-foreground-3 sm:block" />
              <span className="grid size-6 place-items-center rounded-control bg-primary text-primary-foreground">
                <ArrowUp className="size-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
