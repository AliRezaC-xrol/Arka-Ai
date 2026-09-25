import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  KeyRound,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ChatPreview } from "@/components/chat-preview";
import { Reveal } from "@/components/reveal";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "چت هوشمند با پاسخ استریمی",
    description:
      "جواب‌ها کلمه‌به‌کلمه جلوی چشمت شکل می‌گیرند؛ بدون انتظار و بدون رفرش. تاریخچه‌ی گفتگوها ذخیره می‌شود و هر جا خواستی ادامه می‌دهی.",
    icon: MessageSquare,
  },
  {
    title: "تولید تصویر در همان گفتگو",
    description:
      "پرامپت بنویس و نتیجه را همان‌جا ببین. تصویرها کنار متن گفتگو می‌مانند تا مقایسه و استفاده‌ی دوباره ساده باشد.",
    icon: ImageIcon,
  },
  {
    title: "هر پروایدری که بخواهی",
    description:
      "OpenAI، Anthropic، Google یا هر سرویس سازگار با OpenAI. کلید خودت را وصل کن؛ پروایدرهای سراسری هم کنار کلیدهای شخصی‌ات در دسترس‌اند.",
    icon: KeyRound,
  },
  {
    title: "حریم خصوصی و ایزوله بودن",
    description:
      "کلیدها با AES-256-GCM رمزنگاری می‌شوند و گفتگوهایت کاملاً ایزوله می‌مانند؛ فقط خودت آن‌ها را می‌بینی. اگر کلیدی از کار بیفتد، بعدی بی‌سروصدا وارد می‌شود.",
    icon: ShieldCheck,
  },
];

const PROVIDER_CHIPS = ["OpenAI", "Anthropic", "Google", "Azure", "Ollama"];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNavbar />

      {/* Top dissolve: as content scrolls up, it progressively blurs and
          fades into the background instead of being hard-cut by the viewport
          edge (linear.app / vercel style). Purely static CSS layers — no
          scroll listeners. Sits under the navbar so the navbar stays crisp. */}
      <div aria-hidden className="pblur">
        <div className="pblur-1" />
        <div className="pblur-2" />
        <div className="pblur-3" />
        <div className="pblur-4" />
        <div className="pblur-fade" />
      </div>

      <main className="flex-1">
        {/* ================= Hero ================= */}
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          {/* Animated achromatic background: ONE soft spotlight drifting on a
              slow 20s loop behind the headline + a static edge-faded dot
              field. Transform-only animations, killed under reduced motion. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="hero-spot absolute inset-0" />
            <div className="hero-dots absolute inset-0" />
            {/* Hairline horizon that grounds the composition */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
          </div>

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-32 lg:pt-24">
            {/* ---- Copy column (asymmetric: wider, text-start) ---- */}
            <div className="max-w-2xl">
              {/* The ONE place allowed 40–56px (SPEC exception) */}
              <Reveal>
                <h1
                  id="hero-title"
                  className="text-[2.5rem] font-semibold leading-[1.25] tracking-tight sm:text-5xl sm:leading-[1.2] lg:text-[3.5rem] lg:leading-[1.15]"
                >
                  همه‌ی مدل‌های هوش مصنوعی،
                  <br />
                  <span className="text-foreground-2">در یک گفتگو.</span>
                </h1>
              </Reveal>

              <Reveal delay={90}>
                <p className="mt-6 max-w-lg text-base leading-8 text-foreground-2">
                  ارکا محیط چت و تولید تصویر توست؛ هر پروایدری که بخواهی وصل کن،
                  کلیدت امن می‌ماند و اگر سرویسی از کار بیفتد، کار بی‌وقفه
                  ادامه پیدا می‌کند.
                </p>
              </Reveal>

              <Reveal delay={180}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link href="/login">
                    <Button size="lg">شروع کنید</Button>
                  </Link>
                  <Link href="/chat">
                    <Button size="lg" variant="outline">
                      دیدن محیط چت
                      <ArrowLeft aria-hidden />
                    </Button>
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={260}>
                <p className="mt-6 text-xs text-foreground-3">
                  بدون کارت بانکی؛ با کلید خودت شروع کن.
                </p>
              </Reveal>
            </div>

            {/* ---- Layered visual column ----
                Floating pieces are positioned so they only overlap the
                card's EDGES / decorative zones — never real content. */}
            <Reveal delay={220} className="relative hidden lg:block">
              <div className="relative mx-auto max-w-sm pb-12 pt-6">
                {/* Floating provider chips — hang off the card's end edge */}
                <div className="hero-float-late absolute -top-6 -end-16 z-10 flex flex-col items-start gap-2">
                  {PROVIDER_CHIPS.slice(0, 3).map((provider, index) => (
                    <span
                      key={provider}
                      className="rounded-control border border-line bg-elevated px-3 py-1.5 text-[11px] text-foreground-2"
                      style={{ opacity: 1 - index * 0.18 }}
                    >
                      {provider}
                    </span>
                  ))}
                </div>

                {/* Failover chip — floats at the start corner, fully outside */}
                <div className="hero-float absolute -top-9 -start-9 z-10 flex rotate-1 items-center gap-2 rounded-card border border-line bg-elevated px-3 py-2">
                  <Layers aria-hidden className="size-3.5 text-foreground-2" />
                  <span className="text-[10px] leading-4 text-foreground-2">
                    Failover خودکار
                    <br />
                    <span className="text-foreground-3">کلید ۲ وارد شد</span>
                  </span>
                </div>

                {/* Main prompt card */}
                <div className="hero-float relative rounded-card border border-line bg-card p-4">
                  <div className="flex items-center gap-2 border-b border-line pb-3">
                    <Sparkles aria-hidden className="size-4 text-foreground-2" />
                    <span className="text-xs text-foreground-2">گفتگوی جدید</span>
                    <span className="ms-auto flex gap-1" aria-hidden>
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:0ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground-3 [animation-delay:300ms]" />
                    </span>
                  </div>
                  <p className="pt-3 text-[13px] leading-6 text-foreground">
                    یک خلاصه‌ی سه‌پاراگرافی از این مقاله بنویس و تصویر شاخص هم
                    پیشنهاد بده.
                  </p>
                  <div className="mt-3 space-y-1.5" aria-hidden>
                    <span className="block h-2 w-full rounded-full bg-white/8" />
                    <span className="block h-2 w-4/5 rounded-full bg-white/8" />
                    <span className="block h-2 w-2/3 rounded-full bg-white/8" />
                  </div>
                  <div className="mt-4 flex items-center rounded-control border border-line bg-elevated px-3 py-2">
                    <span className="text-[11px] text-foreground-3">پیامی بنویسید…</span>
                  </div>
                </div>

                {/* Floating image-result card — hangs off the bottom-end corner,
                    overlapping only the empty end of the composer strip */}
                <div className="hero-float-late absolute -bottom-16 -end-14 z-10 w-40 -rotate-2 rounded-card border border-line bg-elevated p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground-3">
                    <ImageIcon aria-hidden className="size-3" />
                    تصویر ساخته شد
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5" aria-hidden>
                    <span className="aspect-square rounded-control border border-line bg-gradient-to-br from-white/10 to-transparent" />
                    <span className="aspect-square rounded-control border border-line bg-gradient-to-tl from-white/8 to-transparent" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= Features — real cards, 2×2 ================= */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 lg:py-28" aria-label="قابلیت‌ها">
          <Reveal>
            <div className="max-w-xl">
              <p className="text-xs font-medium text-foreground-3">قابلیت‌ها</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                هرچیزی که برای کار روزانه با هوش مصنوعی لازم داری
              </h2>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 90} className="h-full">
                <div className="group h-full rounded-card border border-line bg-card p-6 transition-[border-color,transform] duration-300 ease-(--motion-ease) hover:-translate-y-0.5 hover:border-white/20 lg:p-7">
                  <div className="grid size-10 place-items-center rounded-control border border-line bg-elevated text-foreground-2 transition-colors duration-300 group-hover:text-foreground">
                    <feature.icon aria-hidden className="size-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 text-[15px] font-semibold">{feature.title}</h3>
                  <p className="mt-2.5 text-[13px] leading-7 text-foreground-2">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= Product preview ================= */}
        <section id="preview" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-10 sm:px-8 lg:py-16" aria-label="پیش‌نمایش محیط چت">
          <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <Reveal>
              <div>
                <p className="text-xs font-medium text-foreground-3">پیش‌نمایش</p>
                <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                  محیطی که دوست داری در آن کار کنی
                </h2>
                <p className="mt-4 text-sm leading-8 text-foreground-2">
                  گفتگوها در ستون کنار، انتخاب مدل بالای صفحه و کادر نوشتن همیشه
                  در دسترس؛ تمیز و بدون شلوغی.
                </p>
                <ul className="mt-6 space-y-3 text-[13px] text-foreground-2">
                  {[
                    "انتخاب مدل بین پروایدرهای متصل",
                    "پاسخ‌های استریمی بدون وقفه",
                    "تاریخچه‌ای که همیشه همراهت است",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span aria-hidden className="size-1 rounded-full bg-foreground-3" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/chat" className="mt-8 inline-block">
                  <Button variant="outline">باز کردن نسخه‌ی نمایشی</Button>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <ChatPreview />
            </Reveal>
          </div>
        </section>

        {/* ================= Final CTA ================= */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 lg:pb-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-card border border-line bg-card px-6 py-14 text-center sm:px-14">
              <div
                aria-hidden
                className="glow pointer-events-none absolute inset-0"
              />
              <div className="relative">
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  آماده‌ی شروعی؟
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground-2">
                  ساخت حساب کمتر از یک دقیقه طول می‌کشد.
                </p>
                <Link href="/login" className="mt-8 inline-block">
                  <Button size="lg">ساخت حساب</Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ================= Footer — one quiet row: copyright + legal links ================= */}
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 text-[13px] text-foreground-3 sm:flex-row sm:items-center sm:px-8">
          <p>© ۲۰۲۵ Arka</p>
          <nav aria-label="پیوندهای پایین صفحه" className="flex items-center gap-6">
            <a
              href="#"
              className="transition-colors duration-200 hover:text-foreground"
            >
              حریم خصوصی
            </a>
            <a
              href="#"
              className="transition-colors duration-200 hover:text-foreground"
            >
              شرایط استفاده
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
