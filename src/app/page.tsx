import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Cpu, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { FaqList } from "@/components/faq-list";
import { MeshCanvas } from "@/components/mesh-canvas";
import { Reveal } from "@/components/reveal";
import { StepsScroll } from "@/components/steps-scroll";
import { HeroWindow } from "@/components/chat-preview";
import { ArkaMark, SiteNavbar } from "@/components/site-navbar";
import { ProviderLogosRow } from "@/components/provider-logos";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const FEATURES = [
  {
    icon: Cpu,
    title: "یک حساب، همه‌ی مدل‌ها",
    text: "GPT، Claude، Gemini، DeepSeek و Grok در یک رابط کاربری ساده. مدل را تغییر دهید، گفتگو بدون وقفه ادامه می‌یابد.",
  },
  {
    icon: Zap,
    title: "جابه‌جایی خودکار کلیدها",
    text: "در صورت بروز خطای سقف سهمیه (Quota)، سیستم بدون قطع گفتگو به کلید آماده‌باش بعدی سوئیچ می‌کند.",
  },
  {
    icon: Sparkles,
    title: "استودیوی تصویر در چت",
    text: "ایده‌ها و پرامپت‌های تصویری را با مدل‌های برتر مثل FLUX در همان پنجره گفتگو دریافت و دانلود کنید.",
  },
  {
    icon: Lock,
    title: "امنیت رمزنگاری AES-256",
    text: "کلیدهای API شخصی شما با استاندارد AES-256-GCM در سرور رمز شده و فقط در زمان ارسال درخواست فراخوانی می‌شوند.",
  },
];

const STEPS = [
  {
    title: "ورود با گوگل",
    text: "با یک کلیک و از طریق حساب گوگل وارد شو.",
  },
  {
    title: "کلید وصل کن",
    text: "کلید هر پروایدری را اضافه کن یا از پروایدرهای آماده استفاده کن.",
  },
  {
    title: "گفتگو کن",
    text: "مدل را از داخل کادر نوشتن انتخاب کن و شروع کن.",
  },
];

const FAQ = [
  {
    q: "آیا برای هر مدل حساب جداگانه نیاز دارم؟",
    a: "خیر. می‌توانید از پروایدرهای آماده ارکا استفاده کنید یا کلیدهای اختصاصی خود را اضافه نمایید.",
  },
  {
    q: "کلیدهای API من چگونه ذخیره و محافظت می‌شوند؟",
    a: "کلیدها با الگوریتم استاندارد AES-256-GCM رمزنگاری شده و تنها سمت سرور در زمان فراخوانی API رمزگشایی می‌شوند؛ هیچ‌گاه به مرورگر ارسال نمی‌گردند.",
  },
  {
    q: "سیستم Failover خودکار چگونه کار می‌کند؟",
    a: "اگر یک کلید با خطای Rate Limit یا سقف مصرف مواجه شود، سامانه خودکار به کلید بعدی سوئیچ کرده و چت کاربر قطع نمی‌شود.",
  },
  {
    q: "آیا تولید تصویر هم مستقیماً در دسترس است؟",
    a: "بله، مدل‌های تصویری پیشرفته نظیر FLUX در انتخاب‌گر مدل‌ها موجود بوده و در همان چت تولید می‌شوند.",
  },
  {
    q: "چگونه می‌توانم حساب یا اطلاعاتم را به طور کامل حذف کنم؟",
    a: "از بخش تنظیمات حساب، با یک کلیک امکان پاک‌سازی کامل تمام کلیدها و تاریخچه چت‌ها به صورت آنی وجود دارد.",
  },
];

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload?.sub) {
      redirect("/chat");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground" dir="rtl">
      <SiteNavbar />

      <main className="flex-1">
        {/* ================= Hero ================= */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
          {/* Animated Sleeping Mesh Monochrome Background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_65%,transparent_100%)] opacity-75"
          >
            <MeshCanvas spacing={56} />
          </div>

          {/* Radial Ambient Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_50%_at_50%_15%,rgba(255,255,255,0.06),transparent_80%)]"
          />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pb-24 lg:pt-20">
            <div>
              <Link
                href="/login"
                className="enter inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] py-1 pe-4 ps-1.5 text-[12.5px] text-neutral-300 transition-colors hover:border-white/30"
              >
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10.5px] font-bold text-black shadow-sm">
                  رایگان
                </span>
                ۱۰۰ پیام هدیه بعد از اولین ورود
              </Link>

              <h1
                id="hero-title"
                className="enter mt-6 text-[2.5rem] font-extrabold leading-[1.25] tracking-tight sm:text-[3.4rem] lg:text-[3.8rem] text-white"
                style={{ ["--enter-delay" as string]: "80ms" }}
              >
                یک حساب
                <br />
                برای همه‌ی مدل‌های
                <br />
                هوش مصنوعی.
              </h1>

              <p
                className="enter mt-5 max-w-xl text-[16px] leading-[1.85] text-neutral-300 sm:text-[17.5px]"
                style={{ ["--enter-delay" as string]: "180ms" }}
              >
                GPT، Claude، Gemini، Grok و DeepSeek در یک محیط یکپارچه، سریع و کاملاً فارسی؛
                با اتصال کلید اختصاصی یا پروایدرهای متمرکز ارکا.
              </p>

              {/* Primary Call to Action — Only 'شروع رایگان' */}
              <div className="enter mt-8 flex items-center gap-4" style={{ ["--enter-delay" as string]: "240ms" }}>
                <Link
                  href="/login"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-bold text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all duration-200 hover:bg-neutral-200 hover:shadow-[0_14px_40px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>شروع رایگان</span>
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                </Link>
              </div>

              {/* Minimalist Monochrome Feature Chips (Redesigned & Clean) */}
              <div className="enter mt-8 flex flex-wrap items-center gap-2.5 text-xs" style={{ ["--enter-delay" as string]: "320ms" }}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">
                  <ShieldCheck className="size-3.5 text-neutral-400" />
                  <span>رمزنگاری AES-256-GCM</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">
                  <Zap className="size-3.5 text-neutral-400" />
                  <span>جابه‌جایی خودکار بدون قطعی چت</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-neutral-300">
                  <Check className="size-3.5 text-neutral-400" />
                  <span>سازگار با OpenAI و Anthropic</span>
                </span>
              </div>
            </div>

            <div className="enter" style={{ ["--enter-delay" as string]: "200ms" }}>
              <HeroWindow />
            </div>
          </div>
        </section>

        {/* ================= Compact & Sleek Provider Logos Strip ================= */}
        <section id="models" aria-labelledby="models-title" className="scroll-mt-16 border-b border-line py-5 bg-[#08080a]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 mb-3">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              <h2 id="models-title" className="text-[12px] font-semibold text-neutral-400 tracking-wide uppercase">
                پروایدرها و مدل‌های فعال در ارکا
              </h2>
            </div>
            <Link href="/login" className="text-[11.5px] font-medium text-neutral-400 hover:text-white transition-colors">
              اتصال و استفاده ←
            </Link>
          </div>
          <ProviderLogosRow />
        </section>

        {/* ================= Why Arka (Monochrome Minimalist Cards) ================= */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-16 bg-[#08080a] py-20 sm:py-24 border-b border-line">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <Reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="text-[12.5px] font-semibold text-neutral-400">چرا ارکا</p>
                <h2 id="features-title" className="mt-2 text-[2.2rem] font-extrabold leading-[1.3] text-white sm:text-[2.7rem]">
                  یک حساب. همه‌ی مدل‌ها. به فارسی.
                </h2>
              </div>
              <p className="max-w-xl text-[16px] leading-[1.85] text-neutral-300">
                نیازی به خرید اشتراک‌های دلاری پراکنده یا جابه‌جایی مداوم میان وب‌سایت‌های مختلف ندارید. تمامی برترین هوش مصنوعی‌ها در یک رابط مونوکروم و سریع در دسترس شما هستند.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal
                    as="article"
                    key={f.title}
                    delay={i * 80}
                    className="group rounded-card border border-white/10 bg-[#0f0f12] p-6 transition-all duration-300 hover:border-white/25 hover:bg-[#141418] shadow-sm"
                  >
                    <span className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/[0.05] text-white transition-colors group-hover:bg-white group-hover:text-black">
                      <Icon aria-hidden className="size-4" strokeWidth={2} />
                    </span>
                    <h3 className="mt-5 text-[16.5px] font-bold text-white">{f.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-6 text-neutral-400">{f.text}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= How it works (With Sleeping Mesh Background) ================= */}
        <section id="how" aria-labelledby="steps-title" className="relative scroll-mt-16 border-b border-line bg-elevated overflow-hidden">
          {/* Animated Sleeping Mesh background specifically in "چطور کار می‌کند" */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_40%,transparent_90%)] opacity-60"
          >
            <MeshCanvas spacing={62} />
          </div>
          <div className="relative z-10">
            <StepsScroll steps={STEPS} />
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_2fr] lg:py-24">
            <div>
              <p className="text-[12.5px] font-semibold text-neutral-400">پاسخ به سوالات</p>
              <h2 id="faq-title" className="mt-2 text-[2.2rem] font-extrabold leading-[1.3] text-white sm:text-[2.7rem]">
                سوالات متداول
              </h2>
              <p className="mt-3 text-xs text-neutral-400 leading-6 max-w-xs">
                پاسخ به رایج‌ترین پرسش‌های کاربران پیرامون نحوه کارکرد ارکا، امنیت کلیدها و سهمیه‌ها.
              </p>
            </div>
            <Reveal delay={100}>
              <FaqList items={FAQ} />
            </Reveal>
          </div>
        </section>

        {/* ================= Dark CTA ================= */}
        <section className="relative overflow-hidden border-t border-line bg-[#09090b] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_85%)] opacity-70"
          >
            <MeshCanvas spacing={60} />
          </div>
          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 px-5 py-18 sm:px-8 lg:flex-row lg:items-center lg:py-22">
            <div>
              <h2 className="text-[2.2rem] font-extrabold leading-[1.3] text-white sm:text-[2.7rem]">
                همین حالا شروع کنید.
                <br />
                مدل خود را انتخاب کنید.
              </h2>
              <p className="mt-3 text-[16px] text-neutral-300">
                حساب بسازید، کلید خود را وصل کنید و بدون محدودیت گفتگو کنید.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-12 shrink-0 items-center rounded-full bg-white px-8 text-[15px] font-bold text-black transition-all hover:bg-neutral-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              ورود سریع با گوگل
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-[#08080a]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-[13px] text-neutral-400 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2 text-foreground">
            <ArkaMark className="size-5 text-white" />
            <span dir="ltr" className="font-display text-[15px] font-bold tracking-[-0.02em] text-white">
              ARKA
            </span>
            <span className="ms-2 text-[13px] text-neutral-500">© ۲۰۲۶</span>
          </div>
          <nav aria-label="پیوندهای پایین صفحه" className="flex items-center gap-6 text-xs">
            <Link href="/chat" className="hover:text-white transition-colors">
              محیط چت
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              ورود
            </Link>
            <a href="#how" className="hover:text-white transition-colors">
              راهنما
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
