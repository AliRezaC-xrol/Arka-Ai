import Link from "next/link";
import { Check, Gauge, Image as ImageIcon, KeyRound, Lock, Sparkles } from "lucide-react";

import { HeroWindow } from "@/components/chat-preview";
import { SiteNavbar } from "@/components/site-navbar";

const PROVIDERS = [
  { name: "OpenAI", sub: "GPT" },
  { name: "Anthropic", sub: "Claude" },
  { name: "Google", sub: "Gemini" },
  { name: "xAI", sub: "Grok" },
  { name: "DeepSeek", sub: "DeepSeek" },
  { name: "Alibaba", sub: "Qwen" },
  { name: "Mistral", sub: "Mistral" },
  { name: "Ollama", sub: "Local" },
];

const FEATURES = [
  { icon: KeyRound, title: "یک محیط، همه‌ی مدل‌ها", text: "GPT، Claude، Gemini و DeepSeek کنار هم؛ فقط اسم مدل را عوض کن." },
  { icon: Gauge, title: "جابه‌جایی خودکار", text: "اگر کلیدی به سقف برسد یا خطا بدهد، درخواست بی‌صدا با کلید بعدی ادامه پیدا می‌کند." },
  { icon: ImageIcon, title: "تصویر در همان گفتگو", text: "پرامپت بنویس و تصویر را کنار متن ببین؛ بدون رفتن به سایت دیگر." },
  { icon: Lock, title: "کلیدهای رمزنگاری‌شده", text: "کلیدها با AES-256-GCM ذخیره می‌شوند و گفتگوها فقط برای خودت قابل دیدن است." },
];

const STEPS = [
  { title: "وارد شو", text: "با ایمیل یا گوگل در کمتر از یک دقیقه حساب بساز." },
  { title: "کلیدت را وصل کن", text: "کلید API هر پروایدری را اضافه کن یا از پروایدرهای آماده استفاده کن." },
  { title: "گفتگو کن", text: "مدل را از داخل کادر نوشتن انتخاب کن و شروع کن." },
];

function Waves() {
  return (
    <div aria-hidden className="waves">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wv" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1f6fff" stopOpacity="0" />
            <stop offset="0.35" stopColor="#1f6fff" stopOpacity="0.9" />
            <stop offset="0.6" stopColor="#6aa6ff" stopOpacity="1" />
            <stop offset="1" stopColor="#1f6fff" stopOpacity="0" />
          </linearGradient>
          <filter id="wblur" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <g fill="none" stroke="url(#wv)">
          <path d="M-50 180 C 300 120, 520 420, 820 520 S 1300 700, 1500 880" strokeWidth="60" opacity="0.28" filter="url(#wblur)" />
          <path d="M-50 180 C 300 120, 520 420, 820 520 S 1300 700, 1500 880" strokeWidth="2" opacity="0.9" />
          <path d="M-50 230 C 280 170, 540 460, 830 560 S 1290 730, 1500 920" strokeWidth="1.2" opacity="0.55" />
          <path d="M-50 130 C 320 80, 500 380, 810 480 S 1310 660, 1500 840" strokeWidth="1" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <SiteNavbar />

      <div aria-hidden className="edge-blur edge-blur--top">
        <span /><span /><span /><span /><span />
      </div>

      <main className="flex-1">
        {/* ================= Hero: text at start (right), product at end ================= */}
        <section aria-labelledby="hero-title" className="relative -mt-16 overflow-hidden border-b border-line pt-16">
          <div aria-hidden className="mesh" />
          <Waves />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

          <div className="hero-dissolve relative z-[1] mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12 lg:pb-32 lg:pt-28">
            <div>
              <Link
                href="/login"
                className="enter inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.03] py-1 pe-3.5 ps-1 text-[13px] text-foreground-2 transition-colors hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="rounded-full bg-blue px-2 py-0.5 text-[11px] font-bold text-white">رایگان</span>
                ۱۰۰ پیام رایگان بعد از ثبت‌نام
              </Link>

              <h1 id="hero-title" className="enter-mark mt-7">
                <span dir="ltr" className="block text-right text-[4.5rem] font-extrabold leading-[0.95] tracking-[-0.05em] text-white sm:text-[6.5rem] lg:text-[7.5rem]">
                  Arka
                </span>
                <span className="mt-4 block text-[2rem] font-bold leading-[1.35] sm:text-[2.75rem]">
                  همه‌ی مدل‌های هوش مصنوعی، در یک گفتگو.
                </span>
              </h1>

              <p className="enter mt-6 max-w-xl text-[17px] leading-8 text-foreground-2" style={{ ["--enter-delay" as string]: "420ms" }}>
                GPT، Claude، Gemini، Grok، DeepSeek و Qwen را در یک محیط تمیز فارسی داشته باش؛
                با کلید خودت یا پروایدرهای آماده.
              </p>

              <div className="enter mt-9 flex flex-wrap gap-3" style={{ ["--enter-delay" as string]: "560ms" }}>
                <Link href="/login" className="btn-blue inline-flex h-12 items-center rounded-control px-7 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  شروع رایگان
                </Link>
                <Link href="/chat" className="btn-quiet inline-flex h-12 items-center rounded-control px-7 text-[15px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  دیدن محیط چت
                </Link>
              </div>

              <ul className="enter mt-9 space-y-2.5 text-[14.5px] text-foreground-2" style={{ ["--enter-delay" as string]: "680ms" }}>
                {["سازگار با OpenAI، Anthropic و Google", "جابه‌جایی خودکار بین کلیدها", "بدون نیاز به کارت بانکی"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Check aria-hidden className="size-4 text-blue" strokeWidth={2.5} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="enter" style={{ ["--enter-delay" as string]: "300ms" }}>
              <HeroWindow />
            </div>
          </div>
        </section>

        {/* ================= Model families ================= */}
        <section aria-labelledby="models-title" className="border-b border-line bg-elevated py-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
            <h2 id="models-title" className="text-[14px] font-medium text-foreground-3">مدل‌هایی که در ارکا در دسترس‌اند</h2>
            <Link href="/chat" className="rounded-sm text-[14px] font-medium text-foreground-2 hover:text-foreground">همه‌ی مدل‌ها</Link>
          </div>
          <div className="mt-7 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <div dir="ltr" className="marquee-track flex w-max gap-16 pe-16">
              {[...PROVIDERS, ...PROVIDERS].map((p, i) => (
                <div key={i} className="flex items-center gap-3 whitespace-nowrap">
                  <span className="grid size-9 place-items-center rounded-[9px] border border-line bg-card text-[15px] font-bold text-foreground-2">
                    {p.sub.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-[17px] font-bold leading-5 text-foreground-2">{p.sub}</span>
                    <span className="block text-[12px] text-foreground-3">{p.name}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= Why Arka ================= */}
        <section id="features" aria-labelledby="features-title" className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <h2 id="features-title" className="text-[2.25rem] font-bold leading-[1.3] sm:text-[3rem]">
              یک حساب. همه‌ی مدل‌ها. همه به فارسی.
            </h2>
            <p className="max-w-xl text-[17px] leading-8 text-foreground-2 lg:justify-self-end">
              دیگر لازم نیست برای هر مدل یک اشتراک جدا بخری و بین چند سایت جابه‌جا شوی. همه‌چیز در یک محیط راست‌چین و تمیز.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-card border border-line bg-elevated p-7 transition-colors duration-150 hover:border-white/15">
                <span className="icon-tile grid size-11 place-items-center rounded-control">
                  <f.icon aria-hidden className="size-5" strokeWidth={1.9} />
                </span>
                <h3 className="mt-7 text-[18px] font-bold">{f.title}</h3>
                <p className="mt-3 text-[14.5px] leading-7 text-foreground-2">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ================= How it works ================= */}
        <section aria-labelledby="steps-title" className="border-y border-line bg-elevated">
          <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-28">
            <h2 id="steps-title" className="text-[2.25rem] font-bold leading-[1.3] sm:text-[3rem]">در یک دقیقه شروع کن</h2>
            <ol className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="bg-background p-8">
                  <span className="font-mono text-[14px] font-bold text-blue">{(i + 1).toLocaleString("fa-IR")}</span>
                  <h3 className="mt-4 text-[20px] font-bold">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-foreground-2">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="mesh" />
          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 px-5 py-24 sm:px-8 lg:flex-row lg:items-center lg:py-28">
            <div>
              <h2 className="text-[2.25rem] font-bold leading-[1.3] sm:text-[3rem]">آماده‌ی شروعی؟</h2>
              <p className="mt-3 text-[17px] leading-8 text-foreground-2">ساخت حساب رایگان است و کارت بانکی لازم نیست.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="btn-blue inline-flex h-12 items-center gap-2 rounded-control px-7 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                <Sparkles aria-hidden className="size-4" />
                ساخت حساب رایگان
              </Link>
              <Link href="/chat" className="btn-quiet inline-flex h-12 items-center rounded-control px-7 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                امتحان نسخه‌ی نمایشی
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-elevated">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <span dir="ltr" className="text-[22px] font-extrabold tracking-[-0.04em]">Arka</span>
            <p className="mt-3 max-w-xs text-[14px] leading-7 text-foreground-3">یک حساب برای همه‌ی مدل‌های هوش مصنوعی، با رابط کاملاً فارسی.</p>
          </div>
          <nav aria-label="محصول" className="space-y-3 text-[14px]">
            <p className="font-semibold text-foreground">محصول</p>
            <Link href="/chat" className="block text-foreground-3 hover:text-foreground">محیط چت</Link>
            <a href="#features" className="block text-foreground-3 hover:text-foreground">قابلیت‌ها</a>
          </nav>
          <nav aria-label="قوانین" className="space-y-3 text-[14px]">
            <p className="font-semibold text-foreground">قوانین</p>
            <a href="#" className="block text-foreground-3 hover:text-foreground">حریم خصوصی</a>
            <a href="#" className="block text-foreground-3 hover:text-foreground">شرایط استفاده</a>
          </nav>
        </div>
        <div className="border-t border-line py-5 text-center text-[13px] text-foreground-3">© ۲۰۲۶ Arka</div>
      </footer>
    </div>
  );
}
