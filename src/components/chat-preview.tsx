import { ArrowUp, ChevronDown, Copy, Paperclip } from "lucide-react";

/**
 * Hero product shot, apmix-style: a dark window on the white page with a
 * floating white detail card. RTL: my message on the right (start), the
 * assistant on the left (end).
 */
export function HeroWindow() {
  return (
    <div aria-hidden className="relative pb-20">
      <div className="overflow-hidden rounded-card border border-black bg-[#0a0a0a] text-start text-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.5)]">
        <div className="relative flex h-10 items-center border-b border-white/10 px-4">
          <span dir="ltr" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
          </span>
          <span dir="ltr" className="absolute inset-x-0 text-center font-mono text-[12px] text-white/45">arka.app/chat</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr]">
          <div className="space-y-5 p-5 sm:order-2">
            <div className="flex flex-col items-start">
              <div className="max-w-[88%] rounded-[14px] rounded-ss-sm bg-white px-4 py-2.5 text-[13px] leading-7 text-[#0a0a0a]">
                یک برنامه‌ی سه‌روزه برای استانبول بچین.
              </div>
              <span className="mt-1 ps-1 font-mono text-[10.5px] text-white/40">۱۰:۴۲</span>
            </div>
            <div className="flex flex-row-reverse items-start gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 font-display text-[11px] font-bold">A</span>
              <div className="max-w-[88%] rounded-[14px] rounded-se-sm border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] leading-7 text-white/70">
                <p className="text-white">حتماً، یک پیشنهاد سبک:</p>
                <p><span className="text-white">روز ۱:</span> ایاصوفیه و بازار بزرگ</p>
                <p><span className="text-white">روز ۲:</span> کشتی بسفر و بالات</p>
                <p><span className="text-white">روز ۳:</span> گالاتا و استقلال<span className="ms-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-white" /></p>
              </div>
            </div>
            <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3">
              <p className="px-1 text-[12px] text-white/40">پیامت را بنویس…</p>
              <div className="mt-2.5 flex items-center gap-2">
                <Paperclip className="size-4 text-white/40" />
                <span className="flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/70">
                  <span dir="ltr">Claude Sonnet 4</span>
                  <ChevronDown className="size-3" />
                </span>
                <span className="ms-auto grid size-7 place-items-center rounded-[8px] bg-white text-[#0a0a0a]">
                  <ArrowUp className="size-3.5" />
                </span>
              </div>
            </div>
          </div>

          <div className="hidden border-e border-white/10 p-3 sm:order-1 sm:block">
            <p className="px-2 pb-2 pt-1 text-[10.5px] text-white/40">امروز</p>
            <p className="truncate rounded-[8px] bg-white/10 px-2.5 py-2 text-[12px]">سفر به استانبول</p>
            <p className="truncate px-2.5 py-2 text-[12px] text-white/55">ایده‌های اینستاگرام</p>
            <p className="px-2 pb-2 pt-3 text-[10.5px] text-white/40">دیروز</p>
            <p className="truncate px-2.5 py-2 text-[12px] text-white/55">خلاصه‌ی مقاله</p>
            <p className="truncate px-2.5 py-2 text-[12px] text-white/55">بازنویسی ایمیل</p>
          </div>
        </div>
      </div>

      {/* Floating white card */}
      <div className="card-soft absolute bottom-0 end-4 w-72 rounded-card p-4 text-start sm:-end-6">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold tracking-wide text-foreground-3">کلید API</span>
          <span className="rounded-full bg-[#f2f2f2] px-2.5 py-0.5 text-[11px] font-medium">طرح حرفه‌ای</span>
        </div>
        <div dir="ltr" className="mt-3 flex items-center justify-between rounded-[10px] bg-[#f5f5f5] px-3 py-2.5 font-mono text-[12px]">
          <span>ark_live_9f3c••••d41e</span>
          <Copy className="size-3.5 text-foreground-3" />
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span className="text-foreground-3">مدل‌ها</span>
          <span className="font-medium">۱۱ خانواده</span>
        </div>
      </div>
    </div>
  );
}
