import { ArrowUp, ChevronDown, Paperclip, Plus, Search, Sparkles } from "lucide-react";

/**
 * Static product shot of the Arka chat shell (marketing page).
 * Same RTL rules as /chat: assistant from inline-start, user bubble at
 * inline-end, model pill inside the composer.
 */
export function ChatPreview() {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-[20px] border border-line bg-background text-start shadow-[0_40px_120px_-30px_rgba(31,111,255,0.55)]"
    >
      {/* Window chrome */}
      <div className="flex h-10 items-center gap-2 border-b border-line bg-elevated px-4">
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span dir="ltr" className="mx-auto rounded-full border border-line px-3 py-0.5 text-[11px] text-foreground-3">
          arka.app/chat
        </span>
      </div>

      <div className="flex h-[420px] sm:h-[480px]">
        {/* Sidebar */}
        <div className="sidebar-bg hidden w-56 shrink-0 flex-col gap-2 border-e border-line p-3 md:flex">
          <span dir="ltr" className="self-end px-1 text-[15px] font-extrabold tracking-[-0.04em]">
            Arka
          </span>
          <span className="btn-blue mt-1 flex h-9 items-center gap-2 rounded-control px-3 text-[12px] font-semibold">
            <Plus className="size-3.5" /> گفتگوی جدید
          </span>
          <span className="flex h-8 items-center gap-2 rounded-control border border-line px-2.5 text-[11px] text-foreground-3">
            <Search className="size-3" /> جستجو…
          </span>
          <p className="mt-2 px-2 text-[10px] text-foreground-3">امروز</p>
          <div className="rounded-control border border-blue-line bg-blue-soft px-2.5 py-2 text-[11.5px] font-medium">
            ایده‌های محتوای اینستاگرام
          </div>
          <p className="px-2.5 py-1.5 text-[11.5px] text-foreground-2">خلاصه‌ی مقاله‌ی ترنسفورمرها</p>
          <p className="mt-1 px-2 text-[10px] text-foreground-3">دیروز</p>
          <p className="px-2.5 py-1.5 text-[11.5px] text-foreground-2">بازنویسی ایمیل به مشتری</p>
          <p className="px-2.5 py-1.5 text-[11.5px] text-foreground-2">برنامه‌ی سفر به استانبول</p>
        </div>

        {/* Conversation */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(31,111,255,0.22),transparent)]" />
          <div className="relative flex min-h-0 flex-1 flex-col justify-end gap-5 p-5">
            <div className="flex flex-col items-end">
              <div className="bubble-user max-w-[80%] rounded-[18px] rounded-se-md px-4 py-2.5 text-[12.5px] leading-6">
                برای پیج طراحی محصول سه ایده‌ی پست بنویس.
              </div>
              <span className="mt-1 text-[10px] text-foreground-3">۱۰:۲۴</span>
            </div>
            <div className="flex gap-2.5">
              <span className="orb grid size-7 shrink-0 place-items-center rounded-full text-white">
                <Sparkles className="size-3.5" />
              </span>
              <div className="min-w-0 space-y-2 text-[12.5px] leading-6 text-foreground-2">
                <p><span className="font-semibold text-foreground">قبل و بعد:</span> ری‌دیزاین واقعی را کنار نسخه‌ی قدیمی نشان بده.</p>
                <p><span className="font-semibold text-foreground">خطای رایج:</span> سه اشتباه در طراحی فرم را با مثال باز کن.</p>
                <p><span className="font-semibold text-foreground">پشت صحنه:</span> یک صفحه را از اسکیس تا نسخه‌ی نهایی<span className="ms-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-blue" /></p>
              </div>
            </div>
          </div>

          <div className="relative p-4 pt-0">
            <div className="composer-ring rounded-card p-3">
              <p className="px-1 text-[12px] text-foreground-3">پیامت را بنویس…</p>
              <div className="mt-3 flex items-center gap-2">
                <Paperclip className="size-4 text-foreground-3" />
                <span className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-2.5 py-1 text-[11px] text-foreground-2">
                  <span dir="ltr">GPT-4o</span>
                  <ChevronDown className="size-3" />
                </span>
                <span className="btn-blue ms-auto grid size-8 place-items-center rounded-control">
                  <ArrowUp className="size-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
