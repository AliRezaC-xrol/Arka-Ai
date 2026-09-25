import { ArrowUp, ChevronDown, Paperclip, Sparkles } from "lucide-react";

/**
 * Hero product shot (apmix-style window + floating detail card).
 * RTL rules match /chat: the user's own message sits at the START side
 * (right), the assistant answers from the END side (left) with an avatar.
 */
export function HeroWindow() {
  return (
    <div aria-hidden className="relative pb-16 sm:pb-10">
      <div className="window overflow-hidden rounded-card text-start">
        <div className="flex h-11 items-center border-b border-line px-4">
          <span dir="ltr" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </span>
          <span className="mx-auto text-[12px] text-foreground-3">برنامه‌ی سفر به استانبول</span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Me — start side (right) */}
          <div className="flex flex-col items-start">
            <div className="bubble-user max-w-[85%] rounded-[16px] rounded-ss-md px-4 py-2.5 text-[13.5px] leading-7">
              برای سه روز استانبول یک برنامه‌ی فشرده بچین؛ بودجه متوسط.
            </div>
            <span className="mt-1 ps-1 text-[11px] text-foreground-3">۱۰:۴۲</span>
          </div>

          {/* Assistant — end side (left) */}
          <div className="flex flex-row-reverse items-start gap-2.5">
            <span className="orb grid size-7 shrink-0 place-items-center rounded-full text-white">
              <Sparkles className="size-3.5" />
            </span>
            <div className="max-w-[85%] rounded-[16px] rounded-se-md border border-line bg-card px-4 py-3 text-[13.5px] leading-7 text-foreground-2">
              <p className="text-foreground">حتماً! یک پیشنهاد سبک:</p>
              <p><span className="font-semibold text-foreground">روز ۱:</span> ایاصوفیه، مسجد آبی و بازار بزرگ</p>
              <p><span className="font-semibold text-foreground">روز ۲:</span> کشتی بسفر و محله‌ی بالات</p>
              <p><span className="font-semibold text-foreground">روز ۳:</span> گالاتا و خیابان استقلال<span className="ms-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-blue" /></p>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="rounded-[14px] border border-line bg-card p-3">
            <p className="px-1 text-[13px] text-foreground-3">پیامت را بنویس…</p>
            <div className="mt-3 flex items-center gap-2">
              <Paperclip className="size-4 text-foreground-3" />
              <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11.5px] text-foreground-2">
                <span dir="ltr">Claude Sonnet 4</span>
                <ChevronDown className="size-3" />
              </span>
              <span className="btn-blue ms-auto grid size-8 place-items-center rounded-control">
                <ArrowUp className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating detail card — overlaps the window's end-bottom corner */}
      <div className="window absolute bottom-0 end-3 w-64 rounded-card p-4 sm:-end-6">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-foreground-2">کلیدهای شما</span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-foreground-3">۳ فعال</span>
        </div>
        <div className="mt-3 space-y-1.5 text-[12px]">
          <div className="flex items-center gap-2 rounded-[8px] bg-white/[0.03] px-2.5 py-1.5">
            <span className="size-1.5 rounded-full bg-foreground-3" />
            <span dir="ltr" className="text-foreground-3 line-through">OpenAI #1</span>
            <span className="ms-auto text-foreground-3">سقف پر شد</span>
          </div>
          <div className="flex items-center gap-2 rounded-[8px] border border-blue-line bg-blue-soft px-2.5 py-1.5">
            <span className="size-1.5 rounded-full bg-blue" />
            <span dir="ltr" className="text-foreground">OpenAI #2</span>
            <span className="ms-auto text-blue">فعال</span>
          </div>
          <div className="flex items-center gap-2 rounded-[8px] bg-white/[0.03] px-2.5 py-1.5">
            <span className="size-1.5 rounded-full bg-foreground-2" />
            <span dir="ltr" className="text-foreground-2">Anthropic</span>
            <span className="ms-auto text-foreground-3">آماده</span>
          </div>
        </div>
      </div>
    </div>
  );
}
