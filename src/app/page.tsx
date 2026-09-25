import Link from "next/link";
import {
  Image as ImageIcon,
  KeyRound,
  Lock,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";

import { ChatPreview } from "@/components/chat-preview";
import { SiteNavbar } from "@/components/site-navbar";

const PROVIDERS = ["OpenAI", "Anthropic", "Google Gemini", "Mistral", "DeepSeek", "Ollama", "Azure OpenAI", "Groq"];

const STEPS = [
  { title: "کلیدت را وصل کن", text: "کلید API هر پروایدری را اضافه کن؛ رمزنگاری‌شده ذخیره می‌شود." },
  { title: "مدل را انتخاب کن", text: "از دکمه‌ی مدل داخل کادر نوشتن، بین همه‌ی مدل‌ها جابه‌جا شو." },
  { title: "گفتگو کن", text: "پاسخ استریمی، تصویر و تاریخچه؛ همه در یک محیط." },
];

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <SiteNavbar />

      <div aria-hidden className="edge-blur edge-blur--top">
        <span /><span /><span /><span /><span />
      </div>

      <main className="flex-1">
        {/* ================= Hero ================= */}
        <section aria-labelledby="hero-title" className="relative -mt-16 overflow-hidden pt-16">
          <div aria-hidden className="aurora" />
          <div aria-hidden className="grid-lines" />

          <div className="hero-dissolve relative z-[1] mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-10 pt-20 text-center sm:px-8 sm:pt-28">
            <Link
              href="/chat"
              className="enter mb-8 inline-flex items-center gap-2 rounded-full border border-blue-line bg-blue-soft py-1 pe-3 ps-1 text-[13px] text-foreground transition-colors hover:bg-blue/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="rounded-full bg-blue px-2 py-0.5 text-[11px] font-semibold text-white">جدید</span>
              Claude Sonnet 4 و Gemini 2.5 اضافه شدند
            </Link>

            <h1 id="hero-title" className="wordmark enter-mark text-gradient-blue relative">
              Arka
            </h1>

            <p
              className="enter mt-6 max-w-2xl text-[1.5rem] font-bold leading-[1.5] text-foreground sm:text-[2rem]"
              style={{ ["--enter-delay" as string]: "380ms" }}
            >
              همه‌ی مدل‌های هوش مصنوعی، در یک گفتگو.
            </p>
            <p
              className="enter mt-4 max-w-xl text-[16px] leading-8 text-foreground-2"
              style={{ ["--enter-delay" as string]: "480ms" }}
            >
              کلید هر پروایدری را وصل کن و بین GPT، Claude و Gemini آزادانه جابه‌جا شو.
              اگر یک سرویس از کار بیفتد، ارکا خودش سراغ بعدی می‌رود.
            </p>

            <div
              className="enter mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
              style={{ ["--enter-delay" as string]: "640ms" }}
            >
              <Link
                href="/login"
                className="btn-blue inline-flex h-12 w-full items-center justify-center rounded-control px-8 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
              >
                رایگان شروع کنید
              </Link>
              <Link
                href="/chat"
                className="card-glass inline-flex h-12 w-full items-center justify-center rounded-control px-8 text-[15px] font-semibold text-foreground transition-colors hover:border-blue-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
              >
                دیدن محیط چت
              </Link>
            </div>
          </div>

          {/* Product shot resting on the glowing horizon */}
          <div className="relative z-[1] mx-auto mt-10 w-full max-w-5xl px-4 pb-24 sm:px-8">
            <div aria-hidden className="horizon" />
            <div className="enter relative" style={{ ["--enter-delay" as string]: "800ms" }}>
              <ChatPreview />
            </div>
          </div>
        </section>

        {/* ================= Providers strip ================= */}
        <section aria-label="پروایدرهای پشتیبانی‌شده" className="border-y border-line bg-elevated/60 py-8">
          <p className="text-center text-[14px] text-foreground-3">با پروایدرهای محبوب کار می‌کند</p>
          <div className="mt-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
            <div dir="ltr" className="marquee-track flex w-max gap-14 pe-14">
              {[...PROVIDERS, ...PROVIDERS].map((name, i) => (
                <span key={i} className="whitespace-nowrap text-[18px] font-semibold tracking-tight text-foreground-2">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ================= Features — bento with visuals ================= */}
        <section id="features" aria-labelledby="features-title" className="relative mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-title" className="text-[2rem] font-bold leading-[1.35] sm:text-[2.5rem]">
              یک محیط، برای همه‌ی کارهای روزانه
            </h2>
            <p className="mt-4 text-[16px] leading-8 text-foreground-2">
              دیگر لازم نیست بین چند سایت و چند اشتراک جابه‌جا شوی.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            {/* Big: providers + failover */}
            <article className="border-gradient relative overflow-hidden rounded-[20px] p-7 md:col-span-4">
              <div aria-hidden className="pointer-events-none absolute -top-24 start-10 size-72 rounded-full bg-blue/25 blur-3xl" />
              <div className="relative">
                <span className="grid size-11 place-items-center rounded-control bg-blue text-white shadow-[0_0_30px_rgba(31,111,255,0.6)]">
                  <KeyRound className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-[1.375rem] font-bold">هر پروایدری که بخواهی، با جابه‌جایی خودکار</h3>
                <p className="mt-2 max-w-lg text-[15px] leading-8 text-foreground-2">
                  چند کلید اضافه کن؛ وقتی یکی خطا بدهد، درخواست بدون وقفه با کلید بعدی ادامه پیدا می‌کند.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    { n: "OpenAI", s: "کلید ۱، سهمیه تمام شد", st: "down" },
                    { n: "OpenAI", s: "کلید ۲، در حال پاسخ", st: "on" },
                    { n: "Anthropic", s: "آماده", st: "idle" },
                    { n: "Google", s: "آماده", st: "idle" },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className={
                        r.st === "on"
                          ? "flex items-center gap-3 rounded-control border border-blue-line bg-blue-soft px-3.5 py-2.5"
                          : "flex items-center gap-3 rounded-control border border-line bg-background/60 px-3.5 py-2.5"
                      }
                    >
                      <span className={r.st === "on" ? "size-2 rounded-full bg-blue shadow-[0_0_10px_#1f6fff]" : r.st === "down" ? "size-2 rounded-full bg-foreground-3/40" : "size-2 rounded-full bg-foreground-3"} />
                      <span dir="ltr" className={r.st === "down" ? "text-[13px] text-foreground-3 line-through" : "text-[13px] font-medium"}>{r.n}</span>
                      <span className="ms-auto text-[12px] text-foreground-3">{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* Streaming */}
            <article className="card-glass relative overflow-hidden rounded-[20px] p-7 md:col-span-2">
              <Zap className="size-6 text-blue" aria-hidden />
              <h3 className="mt-5 text-[1.125rem] font-bold">پاسخ‌های استریمی</h3>
              <p className="mt-2 text-[14px] leading-7 text-foreground-2">جواب کلمه‌به‌کلمه جلوی چشمت شکل می‌گیرد.</p>
              <div className="mt-6 space-y-2 rounded-control border border-line bg-background/60 p-4" aria-hidden>
                <span className="block h-2 w-full rounded-full bg-blue/50" />
                <span className="block h-2 w-5/6 rounded-full bg-blue/35" />
                <span className="block h-2 w-3/5 rounded-full bg-blue/20" />
              </div>
            </article>

            {/* Images */}
            <article className="card-glass relative overflow-hidden rounded-[20px] p-7 md:col-span-3">
              <ImageIcon className="size-6 text-blue" aria-hidden />
              <h3 className="mt-5 text-[1.125rem] font-bold">تولید تصویر در همان گفتگو</h3>
              <p className="mt-2 text-[14px] leading-7 text-foreground-2">پرامپت بنویس و نتیجه را کنار متن ببین.</p>
              <div className="mt-6 grid grid-cols-3 gap-2" aria-hidden>
                <span className="aspect-square rounded-control bg-[radial-gradient(circle_at_30%_30%,#5b9bff,#0a2a8a_70%)]" />
                <span className="aspect-square rounded-control bg-[linear-gradient(160deg,#1f6fff,#02040a)]" />
                <span className="aspect-square rounded-control bg-[radial-gradient(circle_at_70%_60%,#8ab8ff,#1447c9_45%,#050b1f)]" />
              </div>
            </article>

            {/* Privacy */}
            <article className="card-glass relative overflow-hidden rounded-[20px] p-7 md:col-span-3">
              <Lock className="size-6 text-blue" aria-hidden />
              <h3 className="mt-5 text-[1.125rem] font-bold">امن و خصوصی</h3>
              <p className="mt-2 text-[14px] leading-7 text-foreground-2">
                کلیدها با AES-256-GCM رمزنگاری می‌شوند و گفتگوهایت فقط برای خودت قابل دیدن است.
              </p>
              <div dir="ltr" className="mt-6 truncate rounded-control border border-line bg-background/60 px-4 py-3 font-mono text-[12px] text-foreground-3" aria-hidden>
                sk-••••••••••••••••<span className="text-blue">4f2a</span>
              </div>
            </article>
          </div>
        </section>

        {/* ================= How it works (a real sequence) ================= */}
        <section aria-labelledby="steps-title" className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8 lg:pb-32">
          <h2 id="steps-title" className="text-center text-[2rem] font-bold leading-[1.35] sm:text-[2.5rem]">
            در سه قدم شروع کن
          </h2>
          <ol className="relative mt-14 grid gap-4 md:grid-cols-3">
            <div aria-hidden className="absolute inset-x-[16%] top-6 hidden h-px bg-gradient-to-l from-transparent via-blue/60 to-transparent md:block" />
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative flex flex-col items-center text-center">
                <span className="relative grid size-12 place-items-center rounded-full border border-blue-line bg-background text-[17px] font-bold text-blue shadow-[0_0_24px_rgba(31,111,255,0.35)]">
                  {(i + 1).toLocaleString("fa-IR")}
                </span>
                <h3 className="mt-5 text-[1.125rem] font-bold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-[14px] leading-7 text-foreground-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ================= CTA — the loudest blue on the page ================= */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8 lg:pb-32">
          <div className="blue-panel relative overflow-hidden rounded-[24px] px-6 py-16 text-center sm:px-14 sm:py-20">
            <div aria-hidden className="grid-lines opacity-60" />
            <div className="relative">
              <MessageSquare className="mx-auto size-10 text-white/90" aria-hidden />
              <h2 className="mt-6 text-[2rem] font-bold leading-[1.35] text-white sm:text-[2.5rem]">آماده‌ی شروعی؟</h2>
              <p className="mx-auto mt-3 max-w-md text-[16px] leading-8 text-white/80">
                ساخت حساب کمتر از یک دقیقه طول می‌کشد و کارت بانکی لازم نیست.
              </p>
              <Link
                href="/login"
                className="mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-control bg-white px-8 text-[15px] font-bold text-[#0b3fd0] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3fd0]"
              >
                <Sparkles className="size-4" aria-hidden />
                ساخت حساب رایگان
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 text-[13px] text-foreground-3 sm:flex-row sm:items-center sm:px-8">
          <p>© ۲۰۲۶ <span dir="ltr" className="font-bold text-foreground-2">Arka</span></p>
          <nav aria-label="پیوندهای پایین صفحه" className="flex items-center gap-6">
            <a href="#" className="rounded-sm transition-colors hover:text-foreground">حریم خصوصی</a>
            <a href="#" className="rounded-sm transition-colors hover:text-foreground">شرایط استفاده</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
