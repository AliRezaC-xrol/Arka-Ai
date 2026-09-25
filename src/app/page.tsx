import Link from "next/link";
import { Image as ImageIcon, KeyRound, MessageSquare, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "چت هوشمند",
    description: "گفتگوی روان با پاسخ استریمی و تاریخچه‌ای که همیشه ذخیره می‌شود.",
    icon: MessageSquare,
  },
  {
    title: "تولید تصویر",
    description: "پرامپت بنویس و نتایج را در یک گرید تمیز و مرتب ببین.",
    icon: ImageIcon,
  },
  {
    title: "هر پروایدری که بخواهی",
    description:
      "OpenAI، Anthropic، Google یا هر سرویس سازگار — کلید خودت را وصل کن.",
    icon: KeyRound,
  },
  {
    title: "امنیت و ایزولگی",
    description: "کلیدها رمزنگاری می‌شوند و گفتگوها فقط در دسترس خودت هستند.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
        <span className="text-[15px] font-semibold tracking-tight">Arka</span>
        <nav className="flex items-center gap-2" aria-label="ناوبری اصلی">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              ورود
            </Button>
          </Link>
          <Link href="/login" className="hidden sm:block">
            <Button size="sm">شروع کنید</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="glow absolute inset-0" />
          </div>
          <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-20 text-center sm:pt-28">
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs text-foreground-2">
                فاز ۰ — نسخه‌ی نمایشی
              </span>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.3] sm:text-5xl sm:leading-[1.25]">
                همه‌ی مدل‌های هوش مصنوعی، در یک جای ساده
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-foreground-2">
                ارکا محیط چت و تولید تصویر توست؛ هر پروایدری که بخواهی وصل کن،
                کلیدت امن می‌ماند و کار بی‌وقفه ادامه پیدا می‌کند.
              </p>
            </Reveal>
            <Reveal delay={210}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/login">
                  <Button size="lg">شروع کنید</Button>
                </Link>
                <Link href="/chat">
                  <Button size="lg" variant="outline">
                    مشاهده‌ی محیط چت
                  </Button>
                </Link>
              </div>
            </Reveal>
            <Reveal delay={260}>
              <p className="mt-5 text-xs text-foreground-3">
                بدون کارت بانکی — در نسخه‌ی نمایشی، داده‌ها ساختگی هستند.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-5 py-14" aria-label="قابلیت‌ها">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 70} className="h-full">
                <div className="h-full rounded-card border border-line bg-card p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-control border border-line text-foreground-2">
                    <feature.icon aria-hidden className="size-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-foreground-2">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-20 pt-6">
          <Reveal>
            <div className="rounded-card border border-line bg-card p-10 text-center sm:p-14">
              <h2 className="text-2xl font-semibold sm:text-3xl">آماده‌ای شروع کنی؟</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground-2">
                چند کلیک تا اولین گفتگوی تو با ارکا فاصله است.
              </p>
              <Link href="/login" className="mt-7 inline-block">
                <Button size="lg">ساخت حساب</Button>
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 text-xs text-foreground-3">
          <span>© ۲۰۲۵ Arka</span>
          <span>ساخته‌شده با Next.js</span>
        </div>
      </footer>
    </div>
  );
}
