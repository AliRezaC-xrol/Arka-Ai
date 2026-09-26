/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Check, Cpu, Lock, Sparkles, Zap } from "lucide-react";

import { FaqList } from "@/components/faq-list";
import { MeshCanvas } from "@/components/mesh-canvas";
import { Reveal } from "@/components/reveal";
import { ScrollLink } from "@/components/scroll-link";
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
        {/* ================= Hero (Tablet & Laptop 2-col side-by-side; Mobile professional stacked) ================= */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
          {/* Animated Sleeping Mesh Monochrome Background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_65%,transparent_100%)] opacity-80"
          >
            <MeshCanvas spacing={58} />
          </div>

          {/* Radial Ambient Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_50%_at_50%_15%,rgba(255,255,255,0.06),transparent_80%)]"
          />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 md:grid-cols-2 md:gap-8 lg:grid-cols-[1fr_1.07fr] lg:gap-12 lg:pb-24 lg:pt-20 xl:gap-14">
            {/* Right Column: Hero Heading, Description, CTA and Bullets */}
            <div>
              <Link
                href="/login"
                className="enter inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1 pe-3.5 ps-1 text-[12px] text-neutral-200 transition-colors hover:border-white/30 sm:text-[13px]"
              >
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10.5px] font-bold text-black shadow-sm sm:text-[11px]">
                  رایگان
                </span>
                ۱۰۰ پیام رایگان پس از اولین ورود
              </Link>

              <h1
                id="hero-title"
                className="enter mt-5 text-[1.85rem] font-extrabold leading-[1.3] tracking-tight text-white sm:mt-6 sm:text-[2.6rem] md:text-[2.1rem] lg:text-[2.95rem] xl:text-[3.35rem]"
                style={{ ["--enter-delay" as string]: "80ms" }}
              >
                همه‌ی مدل‌های هوش مصنوعی،
                <br />
                <span className="text-neutral-500">در یک گفتگو.</span>
              </h1>

              <p
                className="enter mt-4 max-w-xl text-[14.5px] leading-[1.9] text-neutral-300 sm:mt-5 sm:text-[16px] md:text-[14.5px] lg:text-[16.5px]"
                style={{ ["--enter-delay" as string]: "180ms" }}
              >
                بین GPT، Claude، Gemini، Grok و DeepSeek جابه‌جا شوید — بدون از دست دادن رشته‌ی
                گفتگو. کلید اختصاصی خودتان را وصل کنید یا از پروایدرهای آماده‌ی ارکا استفاده کنید.
                فارسی، سریع و بدون قطعی.
              </p>

              <div
                className="enter mt-7 flex flex-wrap items-center gap-3 sm:mt-8"
                style={{ ["--enter-delay" as string]: "260ms" }}
              >
                <Link
                  href="/login"
                  className="btn-ink inline-flex h-11 items-center rounded-control px-7 text-[14.5px] font-semibold sm:h-12 sm:text-[15px]"
                >
                  شروع رایگان
                </Link>
                <ScrollLink
                  target="how"
                  className="inline-flex h-11 items-center rounded-control border border-line-strong px-6 text-[14.5px] text-foreground-2 transition-colors hover:border-line-stronger hover:text-foreground sm:h-12"
                >
                  چطور کار می‌کند؟
                </ScrollLink>
              </div>

              <ul
                className="enter mt-7 grid gap-2.5 text-[13px] text-foreground-2 sm:mt-8 sm:text-[14px]"
                style={{ ["--enter-delay" as string]: "340ms" }}
              >
                {[
                  "سازگار با OpenAI، Anthropic، Google و DeepSeek",
                  "جابه‌جایی خودکار بین کلیدها، بدون قطع شدن پاسخ",
                  "رمزنگاری کلیدها با استاندارد AES-256-GCM",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 sm:gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-white">
                      <Check aria-hidden className="size-3.5 stroke-[2.5]" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Left Column (Opposite in RTL): Hero Window Showcase */}
            <div className="enter w-full" style={{ ["--enter-delay" as string]: "200ms" }}>
              <HeroWindow />
            </div>
          </div>
        </section>

        {/* ================= Uninterrupted Infinite AI Chain (No Header Bar) ================= */}
        <section aria-label="مدل‌ها و هوش مصنوعی‌های فعال در ارکا" className="w-full">
          <ProviderLogosRow />
        </section>

        {/* ================= Why Arka (Monochrome Minimalist Cards) ================= */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-16 bg-[#08080a] py-20 sm:py-24 border-b border-line">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <Reveal className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[13px] font-semibold text-white shadow-sm">
                <span className="size-2 rounded-full bg-emerald-400" />
                چرا ارکا؟
              </span>
              <h2 id="features-title" className="mt-4 text-[2.2rem] font-extrabold leading-[1.3] text-white sm:text-[2.8rem]">
                یک حساب. همه‌ی مدل‌ها. به فارسی.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.85] text-neutral-300">
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

        {/* ================= How it works (Scroll-driven 1 to 3 progress line, no background) ================= */}
        <section id="how" aria-labelledby="steps-title" className="scroll-mt-16 border-b border-line bg-elevated">
          <StepsScroll steps={STEPS} />
        </section>

        {/* ================= FAQ (Centered) ================= */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 border-b border-line py-20 sm:py-24">
          <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
            <Reveal className="mx-auto max-w-xl text-center mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[12.5px] font-semibold text-neutral-300">
                پاسخ به سوالات
              </span>
              <h2 id="faq-title" className="mt-4 text-[2.2rem] font-extrabold leading-[1.3] text-white sm:text-[2.7rem]">
                سوالات متداول
              </h2>
              <p className="mt-3.5 text-[14.5px] text-neutral-400 leading-7 max-w-md mx-auto">
                پاسخ به رایج‌ترین پرسش‌های کاربران پیرامون نحوه کارکرد ارکا، مدل‌ها و حساب کاربری.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <FaqList items={FAQ} />
            </Reveal>
          </div>
        </section>

        {/* ================= Dark CTA (Centered) ================= */}
        <section className="relative overflow-hidden border-t border-line bg-[#09090b] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_85%)] opacity-70"
          >
            <MeshCanvas spacing={60} />
          </div>
          <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center px-5 py-20 sm:px-8 lg:py-24">
            <h2 className="text-[2.2rem] font-extrabold leading-[1.3] text-white sm:text-[2.8rem] text-center">
              همین حالا شروع کنید.
              <br />
              مدل خود را انتخاب کنید.
            </h2>
            <p className="mt-4 text-[16.5px] text-neutral-300 text-center max-w-xl mx-auto leading-relaxed">
              حساب بسازید، کلید خود را وصل کنید و بدون محدودیت گفتگو کنید.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-9 text-[15px] font-bold text-black transition-all hover:bg-neutral-200 hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
              >
                ورود سریع با گوگل
              </Link>
            </div>
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
