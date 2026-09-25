import Link from "next/link";
import { Check, Gauge, Image as ImageIcon, KeyRound, Lock } from "lucide-react";

import { FaqList } from "@/components/faq-list";
import { MeshCanvas } from "@/components/mesh-canvas";
import { Reveal } from "@/components/reveal";
import { StepsScroll } from "@/components/steps-scroll";
import { HeroWindow } from "@/components/chat-preview";
import { ArkaMark, SiteNavbar } from "@/components/site-navbar";

const MODELS = [
  { name: "GPT", org: "OpenAI" },
  { name: "Claude", org: "Anthropic" },
  { name: "Gemini", org: "Google" },
  { name: "Grok", org: "xAI" },
  { name: "DeepSeek", org: "DeepSeek" },
  { name: "Qwen", org: "Alibaba" },
  { name: "Mistral", org: "Mistral AI" },
  { name: "Llama", org: "Meta" },
];

const FEATURES = [
  { icon: KeyRound, title: "یک حساب، همه‌ی مدل‌ها", text: "GPT، Claude، Gemini، Grok و DeepSeek در یک محیط. فقط مدل را عوض کن، بقیه‌چیز همان است." },
  { icon: Gauge, title: "جابه‌جایی خودکار", text: "اگر کلیدی به سقف برسد یا خطا بدهد، ارکا بی‌صدا سراغ کلید بعدی می‌رود و گفتگو قطع نمی‌شود." },
  { icon: ImageIcon, title: "تصویر در همان گفتگو", text: "پرامپت بنویس و تصویر را کنار متن ببین؛ بدون رفتن به سایت یا اشتراک دیگر." },
  { icon: Lock, title: "امن و خصوصی", text: "کلیدها با AES-256-GCM رمزنگاری می‌شوند و گفتگوهایت فقط برای خودت قابل دیدن است." },
];

const STEPS = [
  { title: "حساب بساز", text: "با ایمیل یا گوگل در کمتر از یک دقیقه وارد شو." },
  { title: "کلید وصل کن", text: "کلید هر پروایدری را اضافه کن یا از پروایدرهای آماده استفاده کن." },
  { title: "گفتگو کن", text: "مدل را از داخل کادر نوشتن انتخاب کن و شروع کن." },
];

const USAGE = [
  { name: "Claude", value: "۲۹٫۱ هزار", pct: 39 },
  { name: "GPT", value: "۲۲٫۴ هزار", pct: 30 },
  { name: "Gemini", value: "۱۳٫۴ هزار", pct: 18 },
  { name: "DeepSeek", value: "۹٫۷ هزار", pct: 13 },
];

const FAQ = [
  { q: "آیا برای هر پروایدر حساب جدا لازم دارم؟", a: "نه. می‌توانی از پروایدرهای آماده‌ی ارکا استفاده کنی یا فقط کلید API پروایدرهایی را که خودت داری اضافه کنی." },
  { q: "کلیدهای من کجا ذخیره می‌شوند؟", a: "کلیدها با AES-256-GCM رمزنگاری و فقط سمت سرور استفاده می‌شوند؛ هیچ‌وقت به مرورگر برگردانده نمی‌شوند." },
  { q: "اگر یک کلید از کار بیفتد چه می‌شود؟", a: "ارکا به‌طور خودکار درخواست را با کلید بعدی همان پروایدر ادامه می‌دهد و تو چیزی حس نمی‌کنی." },
  { q: "تولید تصویر هم دارد؟", a: "بله. مدل‌های تصویری پروایدرهای متصل، مستقیم داخل همان گفتگو در دسترس‌اند." },
  { q: "چطور حسابم را حذف کنم؟", a: "از بخش تنظیمات حساب، با یک کلیک؛ همه‌ی گفتگوها و کلیدها برای همیشه پاک می‌شوند." },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNavbar />

      <main className="flex-1">
        {/* ================= Hero ================= */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
          <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)]">
            <MeshCanvas />
          </div>
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pb-28 lg:pt-24">
            <div>
              <Link href="/login" className="enter inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.03] py-1 pe-3.5 ps-1 text-[13.5px] hover:border-white/25">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-black">رایگان</span>
                ۱۰۰ پیام رایگان بعد از ثبت‌نام
              </Link>

              <h1 id="hero-title" className="enter mt-7 text-[2.6rem] font-extrabold leading-[1.25] tracking-[-0.01em] sm:text-[3.5rem] lg:text-[4rem]" style={{ ["--enter-delay" as string]: "80ms" }}>
                یک حساب
                <br />
                برای همه‌ی مدل‌های
                <br />
                هوش مصنوعی.
              </h1>

              <p className="enter mt-6 max-w-xl text-[17px] leading-[1.95] text-foreground-2 sm:text-[18px]" style={{ ["--enter-delay" as string]: "180ms" }}>
                GPT، Claude، Gemini، Grok، DeepSeek و Qwen را در یک محیط تمیز و کاملاً فارسی داشته باش؛
                با کلید خودت یا پروایدرهای آماده‌ی ارکا.
              </p>

              <div className="enter mt-9 flex flex-wrap gap-3" style={{ ["--enter-delay" as string]: "260ms" }}>
                <Link href="/login" className="btn-ink inline-flex h-12 items-center rounded-control px-6 text-[15px] font-semibold">شروع رایگان</Link>
                <Link href="/chat" className="btn-line inline-flex h-12 items-center rounded-control px-6 text-[15px] font-semibold">دیدن محیط چت</Link>
              </div>

              <ul className="enter mt-9 space-y-3 text-[15px]" style={{ ["--enter-delay" as string]: "340ms" }}>
                {["سازگار با OpenAI، Anthropic و Google", "جابه‌جایی خودکار بین کلیدها", "بدون نیاز به کارت بانکی"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <Check aria-hidden className="size-4" strokeWidth={2.25} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="enter" style={{ ["--enter-delay" as string]: "200ms" }}>
              <HeroWindow />
            </div>
          </div>
        </section>

        {/* ================= Models strip ================= */}
        <section id="models" aria-labelledby="models-title" className="scroll-mt-16 border-b border-line py-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
            <h2 id="models-title" className="text-[13.5px] font-medium text-foreground-3">مدل‌هایی که در ارکا در دسترس‌اند</h2>
            <Link href="/chat" className="text-[14px] font-semibold hover:underline">همه‌ی مدل‌ها</Link>
          </div>
          <div dir="ltr" className="mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div className="marquee">
              {[0, 1].map((copy) => (
                <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-16 pe-16">
                  {MODELS.map((m) => (
                    <li key={m.name} className="flex items-center gap-3 whitespace-nowrap text-foreground-2 transition-colors hover:text-foreground">
                      <span className="grid size-10 place-items-center rounded-full border border-line font-display text-[15px] font-bold">{m.name.charAt(0)}</span>
                      <span>
                        <span className="block font-display text-[20px] font-bold leading-6 tracking-[-0.02em]">{m.name}</span>
                        <span className="block text-[12px] text-foreground-3">{m.org}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        {/* ================= Why ================= */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-16 bg-elevated">
          <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-28">
            <Reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="text-[13.5px] font-semibold text-foreground-3">چرا ارکا</p>
                <h2 id="features-title" className="mt-3 text-[2.25rem] font-extrabold leading-[1.3] sm:text-[3rem]">یک حساب. همه‌ی مدل‌ها. به فارسی.</h2>
              </div>
              <p className="max-w-xl text-[17px] leading-[1.95] text-foreground-2">
                دیگر لازم نیست برای هر مدل یک اشتراک جدا بخری و بین چند سایت جابه‌جا شوی. همه‌چیز در یک محیط راست‌چین و تمیز.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <Reveal as="article" key={f.title} delay={i * 90} className="rounded-card border border-line bg-background p-7 transition-colors hover:border-white/20">
                  <span className="grid size-11 place-items-center rounded-control bg-white text-black">
                    <f.icon aria-hidden className="size-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-7 text-[18px] font-bold">{f.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-7 text-foreground-2">{f.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= How it works (horizontal, scroll-driven) ================= */}
        <section id="how" aria-labelledby="steps-title" className="scroll-mt-16 border-b border-line bg-elevated">
          <StepsScroll steps={STEPS} />
        </section>

        {/* ================= Usage ================= */}
        <section id="usage" aria-labelledby="usage-title" className="scroll-mt-16">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-28">
            <Reveal>
              <p className="text-[13.5px] font-semibold text-foreground-3">مصرف</p>
              <h2 id="usage-title" className="mt-3 text-[2.25rem] font-extrabold leading-[1.3] sm:text-[3rem]">عددی که واقعاً<br />می‌شود خواندش.</h2>
              <p className="mt-6 max-w-lg text-[17px] leading-[1.95] text-foreground-2">
                مصرف همه‌ی مدل‌ها و همه‌ی کلیدها یک‌جا دیده می‌شود. سقف روزانه یا هفتگی نداری، مگر اینکه خودت بگذاری.
              </p>
              <ul className="mt-8 space-y-3.5 text-[15px]">
                {["مصرف هر مدل جدا نمایش داده می‌شود", "برای هر کلید سقف دلخواه بگذار", "هشدار قبل از رسیدن به سقف"].map((t) => (
                  <li key={t} className="flex items-center gap-3"><Check aria-hidden className="size-4" strokeWidth={2.25} />{t}</li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120} className="card-soft rounded-card p-7 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[13px] font-semibold text-foreground-3">این ماه</p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium">۱۲ روز تا شروع دوباره</span>
              </div>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                <span className="font-display text-[3.25rem] font-bold leading-none tracking-[-0.03em] sm:text-[4rem]">۷۴٫۶ هزار</span>
                <span className="text-[16px] text-foreground-2">از ۱۲۰ هزار پیام</span>
              </p>
              <div className="mt-7 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[62%] rounded-full bg-white" />
              </div>
              <div className="mt-2 flex justify-between text-[12px] text-foreground-3"><span>۰</span><span className="text-foreground">٪۶۲</span><span>۱۲۰ هزار</span></div>

              <p className="mt-8 text-[13px] font-semibold text-foreground-3">مصرف به تفکیک مدل</p>
              <ul className="mt-4 space-y-3.5">
                {USAGE.map((u) => (
                  <li key={u.name} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-4 text-[14px]">
                    <span dir="ltr" className="text-right font-medium">{u.name}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-white/75" style={{ width: `${u.pct * 2}%` }} /></span>
                    <span className="text-left font-medium">{u.value}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_2fr] lg:py-28">
            <div>
              <p className="text-[13.5px] font-semibold text-foreground-3">سوالات متداول</p>
              <h2 id="faq-title" className="mt-3 text-[2.25rem] font-extrabold leading-[1.3] sm:text-[3rem]">سوال‌ها،<br />با جواب.</h2>
            </div>
            <Reveal delay={100}>
              <FaqList items={FAQ} />
            </Reveal>
          </div>
        </section>

        {/* ================= Dark CTA band ================= */}
        <section className="relative overflow-hidden border-t border-line bg-elevated text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_85%)]">
            <MeshCanvas />
          </div>
          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-center lg:py-28">
            <div>
              <h2 className="text-[2.25rem] font-extrabold leading-[1.3] sm:text-[3rem]">همین حالا شروع کن.<br />هر وقت خواستی عوضش کن.</h2>
              <p className="mt-4 text-[18px] text-white/65">حساب بساز، کلید وصل کن و با هر مدلی که خواستی گفتگو کن.</p>
            </div>
            <Link href="/login" className="inline-flex h-12 shrink-0 items-center rounded-control bg-white px-7 text-[15px] font-semibold text-[#0a0a0a] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              شروع کنید
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-[13px] text-foreground-3 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2 text-foreground">
            <ArkaMark className="size-5" />
            <span dir="ltr" className="font-display text-[15px] font-bold tracking-[-0.02em]">ARKA</span>
            <span className="ms-2 text-[13px] text-foreground-3">© ۲۰۲۶</span>
          </div>
          <nav aria-label="پیوندهای پایین صفحه" className="flex items-center gap-6">
            <Link href="/chat" className="rounded-sm hover:text-foreground">محیط چت</Link>
            <a href="#" className="rounded-sm hover:text-foreground">شرایط استفاده</a>
            <a href="#" className="rounded-sm hover:text-foreground">حریم خصوصی</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
