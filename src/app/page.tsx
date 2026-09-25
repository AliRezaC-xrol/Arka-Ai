import Link from "next/link";
import {
  Image as ImageIcon,
  KeyRound,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

import { ChatPreview } from "@/components/chat-preview";
import { SiteNavbar } from "@/components/site-navbar";
import { buttonClasses } from "@/components/ui/button";

/* Secondary features — deliberately smaller and quieter than the
   provider card, which is the product's real differentiator. */
const SECONDARY_FEATURES = [
  {
    title: "پاسخ‌های استریمی",
    description:
      "جواب کلمه‌به‌کلمه جلوی چشمت شکل می‌گیرد و تاریخچه‌ی هر گفتگو ذخیره می‌ماند.",
    icon: MessageSquare,
  },
  {
    title: "تصویر در همان گفتگو",
    description:
      "پرامپت بنویس و نتیجه را کنار متن ببین؛ مقایسه و استفاده‌ی دوباره ساده است.",
    icon: ImageIcon,
  },
  {
    title: "کلیدها رمزنگاری‌شده",
    description:
      "کلیدها با AES-256-GCM ذخیره می‌شوند و گفتگوهایت فقط برای خودت قابل دیدن است.",
    icon: ShieldCheck,
  },
];

const PROVIDER_ROWS = [
  { name: "OpenAI", note: "کلید ۱", state: "down" as const },
  { name: "OpenAI", note: "کلید ۲", state: "active" as const },
  { name: "Anthropic", note: "آماده", state: "idle" as const },
  { name: "Google", note: "آماده", state: "idle" as const },
];

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <SiteNavbar />

      {/* Skiper-style edge dissolve: content crossing the top or bottom of
          the viewport progressively blurs (stacked, masked backdrop blurs)
          and fades into black instead of being hard-cut. */}
      <div aria-hidden className="edge-blur edge-blur--top">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div aria-hidden className="edge-blur edge-blur--bottom">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <main className="flex-1">
        {/* ================= Hero ================= */}
        <section
          aria-labelledby="hero-title"
          className="relative -mt-16 flex min-h-[92svh] items-center overflow-hidden pt-16"
        >
          <div aria-hidden className="ambient" />

          <div className="hero-dissolve relative z-[1] mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-20 pt-10 text-center sm:px-8">
            <div className="relative">
              <div aria-hidden className="wordmark-halo" />
              <h1 id="hero-title" className="wordmark enter-mark relative">
                Arka
              </h1>
            </div>

            <p
              className="enter mt-6 max-w-xl text-[1.375rem] font-semibold leading-[1.55] text-foreground sm:text-[1.625rem]"
              style={{ ["--enter-delay" as string]: "380ms" }}
            >
              همه‌ی مدل‌های هوش مصنوعی، در یک گفتگو.
            </p>
            <p
              className="enter mt-3 max-w-md text-[15px] leading-8 text-foreground-2"
              style={{ ["--enter-delay" as string]: "480ms" }}
            >
              کلید هر پروایدری را وصل کن؛ اگر یکی از کار بیفتد، ارکا بی‌صدا
              سراغ بعدی می‌رود و گفتگو قطع نمی‌شود.
            </p>

            <div
              className="enter mt-9 flex flex-wrap items-center justify-center gap-3"
              style={{ ["--enter-delay" as string]: "640ms" }}
            >
              <Link href="/login" data-ready="true" className={buttonClasses({ size: "lg", className: "send-btn" })}>
شروع کنید
</Link>
              <Link href="/chat" className={buttonClasses({ variant: "outline", size: "lg" })}>
دیدن محیط چت
</Link>
            </div>
          </div>
        </section>

        {/* ================= Features — weighted bento ================= */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 lg:py-28"
        >
          <h2
            id="features-title"
            className="max-w-xl text-[1.75rem] font-semibold leading-[1.4] sm:text-[2rem]"
          >
            هرچیزی که برای کار روزانه با هوش مصنوعی لازم داری
          </h2>

          <div className="mt-10 grid gap-4 lg:mt-12 lg:grid-cols-3 lg:grid-rows-3">
            {/* Primary feature: larger, blue-tinted, with a live-looking
                failover illustration. The only card that uses the accent. */}
            <article className="relative overflow-hidden rounded-card border border-blue-line bg-card p-6 sm:p-8 lg:col-span-2 lg:row-span-3">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-32 start-1/4 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(47,123,255,0.18),transparent)]"
              />
              <div className="relative flex h-full flex-col">
                <div className="grid size-11 place-items-center rounded-control border border-blue-line bg-blue-soft text-blue">
                  <KeyRound aria-hidden className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 text-[1.375rem] font-semibold leading-[1.5]">
                  هر پروایدری که بخواهی، با جابه‌جایی خودکار
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-8 text-foreground-2">
                  OpenAI، Anthropic، Google یا هر سرویس سازگار با OpenAI. چند
                  کلید اضافه کن؛ وقتی یکی خطا بدهد، درخواست بدون وقفه با کلید
                  بعدی ادامه پیدا می‌کند.
                </p>

                <ul
                  aria-label="نمونه‌ی وضعیت کلیدها"
                  className="mt-8 grid gap-2 sm:mt-auto sm:max-w-md"
                >
                  {PROVIDER_ROWS.map((row, index) => (
                    <li
                      key={`${row.name}-${index}`}
                      className={
                        row.state === "active"
                          ? "flex items-center gap-3 rounded-control border border-blue-line bg-blue-soft px-4 py-2.5"
                          : "flex items-center gap-3 rounded-control border border-line bg-elevated px-4 py-2.5"
                      }
                    >
                      <span
                        aria-hidden
                        className={
                          row.state === "active"
                            ? "size-2 rounded-full bg-blue shadow-[0_0_10px_var(--accent-glow)]"
                            : row.state === "down"
                              ? "size-2 rounded-full border border-foreground-3"
                              : "size-2 rounded-full bg-foreground-3"
                        }
                      />
                      <span
                        dir="ltr"
                        className={
                          row.state === "down"
                            ? "text-[13px] text-foreground-3 line-through"
                            : "text-[13px] text-foreground"
                        }
                      >
                        {row.name}
                      </span>
                      <span className="ms-auto text-[12px] text-foreground-3">
                        {row.state === "active"
                          ? `${row.note}، در حال پاسخ`
                          : row.state === "down"
                            ? `${row.note}، خطای سهمیه`
                            : row.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {SECONDARY_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="flex gap-4 rounded-card border border-line bg-elevated p-5 transition-colors duration-150 hover:border-white/20"
              >
                <feature.icon
                  aria-hidden
                  className="mt-1 size-5 shrink-0 text-foreground-2"
                  strokeWidth={1.5}
                />
                <div>
                  <h3 className="text-[15px] font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-7 text-foreground-2">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ================= Product preview ================= */}
        <section
          id="preview"
          aria-labelledby="preview-title"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-10 sm:px-8 lg:py-16"
        >
          <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <h2
                id="preview-title"
                className="text-[1.75rem] font-semibold leading-[1.4] sm:text-[2rem]"
              >
                محیطی که دوست داری در آن کار کنی
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-8 text-foreground-2">
                گفتگوها در ستون کنار، انتخاب مدل درست داخل کادر نوشتن، و پاسخ‌هایی
                که با خیال راحت می‌شود خواندشان.
              </p>
              <Link href="/chat" className={buttonClasses({ variant: "outline", className: "mt-8" })}>
باز کردن نسخه‌ی نمایشی
</Link>
            </div>
            <ChatPreview />
          </div>
        </section>

        {/* ================= Final CTA ================= */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-28 pt-16 text-center sm:px-8 lg:pb-36">
          <h2 className="text-[1.75rem] font-semibold leading-[1.4] sm:text-[2rem]">
            آماده‌ی شروعی؟
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-8 text-foreground-2">
            ساخت حساب کمتر از یک دقیقه طول می‌کشد و کارت بانکی لازم نیست.
          </p>
          <Link href="/login" className={buttonClasses({ size: "lg", className: "mt-8" })}>
ساخت حساب
</Link>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 text-[13px] text-foreground-3 sm:flex-row sm:items-center sm:px-8">
          <p>
            © ۲۰۲۶ <span dir="ltr">Arka</span>
          </p>
          <nav aria-label="پیوندهای پایین صفحه" className="flex items-center gap-6">
            <a href="#" className="rounded-sm transition-colors duration-150 hover:text-foreground">
              حریم خصوصی
            </a>
            <a href="#" className="rounded-sm transition-colors duration-150 hover:text-foreground">
              شرایط استفاده
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
