import { ArrowUp, ChevronDown, Paperclip, Sparkles } from "lucide-react";

/**
 * Static illustration of the Arka chat shell for the marketing page.
 * Mirrors the real /chat layout exactly (same RTL rules): assistant text
 * flows from the reading edge (inline-start), the user bubble sits on the
 * inline-end side, the model pill lives inside the composer.
 */
export function ChatPreview() {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-card border border-line bg-background text-start"
    >
      <div className="ambient ambient--chat" />
      <div className="relative flex h-[340px] sm:h-[380px]">
        <div className="hidden w-44 shrink-0 flex-col gap-1 border-e border-line bg-elevated/60 p-3 sm:flex">
          <span dir="ltr" className="mb-2 self-start px-1 text-[12px] font-extrabold tracking-tight">
            Arka
          </span>
          <div className="rounded-control border border-blue-line bg-blue-soft px-2.5 py-2">
            <p className="truncate text-[11px] font-medium text-foreground">
              ایده‌های محتوای اینستاگرام
            </p>
          </div>
          {["خلاصه‌ی مقاله‌ی ترنسفورمرها", "بازنویسی ایمیل به مشتری", "برنامه‌ی سفر به استانبول"].map(
            (title) => (
              <div key={title} className="px-2.5 py-2">
                <p className="truncate text-[11px] text-foreground-2">{title}</p>
              </div>
            ),
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 p-4">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-card rounded-se-md border border-line bg-card px-3 py-2 text-[11px] leading-5">
                سه ایده‌ی پست برای پیج طراحی محصول بنویس.
              </div>
            </div>
            <div className="flex gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-blue-line bg-blue-soft text-blue">
                <Sparkles className="size-3" />
              </span>
              <div className="min-w-0 text-[11px] leading-6 text-foreground-2">
                <p className="text-foreground">قبل و بعد: ری‌دیزاین واقعی را کنار نسخه‌ی قدیمی نشان بده.</p>
                <p>خطای رایج: سه اشتباه در طراحی فرم را با مثال باز کن.</p>
              </div>
            </div>
          </div>

          <div className="p-3 pt-0">
            <div className="rounded-card border border-blue-line bg-card p-2.5 shadow-[0_0_30px_-12px_var(--accent-glow)]">
              <p className="px-1 text-[11px] text-foreground-3">پیامت را بنویس…</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Paperclip className="size-3.5 text-foreground-3" />
                <span className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-foreground-2">
                  <span dir="ltr">GPT-4o</span>
                  <ChevronDown className="size-3" />
                </span>
                <span className="ms-auto grid size-6 place-items-center rounded-control bg-blue text-white">
                  <ArrowUp className="size-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
