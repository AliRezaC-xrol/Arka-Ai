# Arka — Phase 0 Report

> وضعیت: **تکمیل‌شده** — `pnpm build` / `pnpm lint` / `pnpm typecheck` همگی با صفر خطا پاس می‌شوند.
> تاریخ: ۲۰۲۵-۰۹-۲۵

## 1. چه چیزی ساخته شد (تطبیق با پرامپت فاز ۰)

### a) توکن‌های طراحی (بخش ۱۰ SPEC)
- فایل `src/app/globals.css` دقیقاً متغیرهای بخش ۱۰ را تعریف می‌کند: `--bg`, `--bg-elevated`, `--bg-card`, `--text`, `--text-2`, `--text-3`, `--border`, `--hover`, `--radius-control: 10px`, `--radius-card: 16px`, و استک `--font-sans`.
- فقط **یک تم مشکی** وجود دارد؛ هیچ سوییچ روشن/تیره‌ای وجود ندارد و `prefers-color-scheme` هم عمداً بی‌اثر است.
- هیچ `box-shadow` در هیچ‌جای پروژه استفاده نشده؛ ارتفاع (elevation) فقط با بردر ۱px کم‌کنتراست (`--border`) ساخته می‌شود. هیچ رنگی جز سیاه/سفید/خاکستری در هیچ فایلی نیست.
- **فونت فارسی:** Vazirmatn نسخه v33.003 به‌صورت self-host در `src/fonts/` (وزن‌های 400/500/600، فرمت woff2) با `next/font/local` لود می‌شود — نه Google Fonts. مجوز OFL در `src/fonts/OFL.txt` همراه فونت‌هاست.
- **فونت لاتین:** استک `-apple-system, BlinkMacSystemFont` اول استک است؛ روی دستگاه‌های اپل ظاهر SF Pro می‌گیرد و در ویندوز/اندروید خودکار به فونت سیستم برمی‌گردد (دقیقاً مطابق تصمیم قفل‌شده‌ی SPEC §1). فارسی به‌دلیل نبودِ گلیف عربی در فونت‌های سیستم اپل، از «Vazirmatn» در ادامه‌ی استک برمی‌دارد.

### b) صفحه‌ی هیرو (بخش ۶ SPEC) — `/`
- هدر با وردمارک Arka + دکمه‌های ورود/شروع، تیتر قوی تک‌جمله‌ای، زیرنویز کوتاه و یک CTA اصلی («شروع کنید») به‌همراه یک CTA ثانویه برای دیدن محیط چت.
- چهار بلوک ویژگی (آیکون + عنوان کوتاه + یک جمله): چت هوشمند، تولید تصویر، هر پروایدر که بخواهی، امنیت و ایزولگی. آیکون‌ها از lucide-react با `strokeWidth={1.5}` و تک‌رنگ.
- همه‌ی بلوک‌ها با کامپوننت `Reveal` (پیاده‌سازی `IntersectionObserver` در `src/components/reveal.tsx`) در اولین ورود به viewport با fade + 16px جابه‌جایی ظاهر می‌شوند؛ با استگر ۷۰ms بین کارت‌ها.
- `prefers-reduced-motion: reduce` کاملاً رعایت شده: در CSS انیمیشن reveal/step/dot-grid/glow خاموش و محتوا از همان ابتدا visible است. بدون JS هم `<noscript>` محتوا را visible نگه می‌دارد.
- کارت CTA پایانی + فوتر مینیمال با hairline border.

### c) صفحه‌ی ورود — فقط UI (بخش ۷.۱ SPEC) — `/login`
- پس‌زمینه‌ی محیطی: گرید نقطه‌ای کم‌کنتراست که با انیمیشن ۹۰ ثانیه‌ای آرام جابه‌جا می‌شود (`dot-grid`) + یک گرادیانت نوری خیلی ملایم (`glow`).
- کارت ورود با `--radius-card` و بردر hairline؛ سه گام: انتخاب روش → فیلد ایمیل → ورود کد.
- دکمه‌های «ادامه با گوگل» (پرایمری) و «ادامه با ایمیل» (آوتلاین).
- صفحه‌ی کد با کامپوننت `OtpInput` (سورس `src/components/otp-input.tsx`): ۶ باکس جدا، auto-focus بین باکس‌ها، Backspace روی باکس خالی به عقب برمی‌گردد، Arrow keys بین باکس‌ها حرکت می‌کنند، **paste یک کد کامل همه‌ی باکس‌ها را پر می‌کند**، گروه با `dir="ltr"` است تا معنای کد در صفحه‌ی RTL ثابت بماند، و باکس اول `autocomplete="one-time-code"` دارد.
- هیچ منطق OAuth/OTP واقعی وجود ندارد؛ هر اقدامی پیام شفاف «در فاز ۱ متصل می‌شود» نشان می‌دهد.

### d) باکس اسپاتلایت (بخش ۵ SPEC) — `src/components/spotlight-list.tsx`
- باکسِ کم‌کنتراست (پس‌زمینه `--hover` + بردر `--border`) پشت آیتم فعال؛ در زمان کلیک، `offsetTop/offsetLeft/offsetWidth/offsetHeight` آیتم مقصد اندازه‌گیری می‌شود و باکس با `transform: translate(...)` و easing `cubic-bezier(0.65,0,0.35,1)` در ~۳۵۰ms سُر می‌خورد — نه پرش. عرض/ارتفاع باکس هم اگر متفاوت باشد انیمیت می‌شود.
- **RTL:** چون `offsetLeft/offsetTop` مختصات فیزیکی نسبت به offsetParent هستند و `translate()` هم فیزیکی است، رفتار در RTL بدون هیچ منطق اضافه‌ای درست است.
- remeasure خودکار روی: تغییر آیتم فعال، resize پنجره، `ResizeObserver` کانتینر، و `document.fonts.ready` (تغییر متریک بعد از لود فونت).
- کیبورد: `ArrowUp/ArrowDown/Home/End` انتخاب و فوکوس را جابه‌جا می‌کنند؛ الگوی ARIA `listbox/option` با `aria-selected`.
- `prefers-reduced-motion`: transition باکس با `!important` غیرفعال می‌شود (پرش آنی، بدون حرکت).
- دموی زنده در صفحه‌ی چت: سایدبار با ۷ گفتگوی ساختگی — کلیک بین آن‌ها حرکت نرم باکس را نشان می‌دهد.

### e) شِل چت موک — `/chat`
- سایدبار: وردمارک، دکمه‌ی «گفتگوی جدید»، فیلد جستجو، لیست تاریخچه با کامپوننت اسپاتلایت بالا، ردیف پروفایل ساختگی. در موبایل (<md) سایدبار به‌صورت drawer با backdrop باز/بسته می‌شود.
- ستون اصلی: نوار بالا با انتخاب‌گر مدل، حالت خالی welcome با سه چیپ پیشنهادی، و باکس ورودی پیام در پایین (textarea + دکمه‌ی ارسال).
- انتخاب‌گر مدل (`src/components/model-picker.tsx`): مدل‌های ساختگی گروه‌بندی‌شده بر اساس Provider (OpenAI / Anthropic / Google — دقیقاً مثل نمایش نهایی بخش ۴.۴)، با کیبورد کامل: بازکردن با Enter/Space/ArrowDown، حرکت با فلش‌ها، Escape برای بستن و بازگشت فوکوس به trigger، بستن با کلیک بیرون.
- هیچ فراخوانی بک‌اندی انجام نمی‌شود؛ فرم submit را preventDefault می‌کند.

### فاز ۰ — موارد خواسته‌شده‌ی عمومی
- **ریسپانسیو ۳۶۰px:** گرید ویژگی‌ها تک‌ستونه، سایدبار drawer، عرض dropdown محدود به `calc(100vw-2rem)`، باکس‌های OTP با `grid-cols-6` جمع می‌شوند، و `body { overflow-x: clip }` به‌همراه `min-w-0` در همه‌ی ردیف‌های flex از هر اسکرول افقی جلوگیری می‌کند.
- **کیبورد + فوکوس مرئی:** قانون سراسری `:focus-visible` با outline سفید ۱.۵px و offset ۲px که پس‌زمینه‌ی radius را دنبال می‌کند.
- **فراداده:** `<html lang="fa" dir="rtl">`، عنوان/توضیحات فارسی، `themeColor: #000000`، آیکون `src/app/icon.svg`.

## 2. اسکلت پروژه
- Next.js **15.5.26** (App Router) + React 19 + TypeScript strict — در محدوده‌ی «Next.js 14+».
- Tailwind CSS **v4** (CSS-first؛ توکن‌ها با `@theme inline` به utilityها مپ شده‌اند: `bg-card`, `border-line`, `text-foreground-2`, `rounded-control`, `rounded-card`, ...).
- کامپوننت‌های shadcn/ui-style در `src/components/ui/` (button / input / card) + `components.json` — سازگار با CLI رسمی shadcn برای فازهای بعد (مثلاً `pnpm dlx shadcn add dialog`).
- وابستگی‌های UI: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
- **Prisma:** `prisma/schema.prisma` طبق بخش ۲ اسکیفت شد ولی عمداً **به هیچ دیتابیسی وصل نیست** — نه `prisma generate` اجرا شده، نه `DATABASE_URL` تنظیم است (`.env.example` فقط راهنمای فازهای بعد است).
- `packageManager: pnpm@10.34.5` برای بازتولیدپذیری نصب؛ `pnpm-workspace.yaml` فقط `unrs-resolver` را برای build script مجاز کرده.
- اسکریپت‌ها: `dev` / `build` / `start` / `lint` / `typecheck` (=`tsc --noEmit`).

## 3. انحرافات از SPEC و دلیل آن‌ها
1. **`@relation` صریح در Prisma schema:** فایل بخش ۲ «خلاصه» است و رابطه‌ها را بدون `@relation` نوشته؛ Prisma چنین اسکیمایی را reject می‌کند. برای اینکه فاز ۱ مستقیم `prisma validate/generate` را پاس کند، رابطه‌ها صریح شدند (با `onDelete: Cascade` منطقی) — مدل‌داده و فیلدها بدون تغییر.
2. **مدل‌های `Account` و `Session` (Auth.js) اضافه شدند:** SPEC در `User.sessions` به `Session` ارجاع می‌دهد ولی مدلش را تعریف نمی‌کند؛ بدون آن schema کامپایل نمی‌شد. حداقلِ شکل استاندارد Auth.js اضافه شد تا فاز ۱ هر دو استراتژی JWT/دیتابیس را داشته باشد.
3. **کامپوننت‌های vibefarsi / Skiper / Microkit در دسترس نبودند:** این ریپو از صفر ساخته شده و آن‌ها در این سشن موجود نیستند. طبق خود SPEC §10 («هرچه از Skiper در دسترس نبود … نسخه‌ی اورجینال ساخته می‌شود، هرگز کپی از نسخه‌ی پولی نمی‌شود»)، باکس اسپاتلایت و بقیه‌ی کامپوننت‌ها به‌صورت اورجینال از پایه نوشته شدند.
4. **shadcn/ui به‌صورت دستی-authored شد:** به‌جای اجرای CLI (که توکن‌های رنگی oklch پیش‌فرضش با پالت مشکی SPEC در تضاد است)، کامپوننت‌ها با قرارداد و ساختار shadcn (کلاس `cn`, cva, `data-slot`, aliases) دستی نوشته شدند و `components.json` برای استفاده‌ی بعدی از CLI موجود است. نتیجه: کنترل ۱۰۰٪ روی پالت و صفر انحراف از بخش ۱۰.
5. **نسخه‌ی pnpm:** pnpm 12 رفتار build-script تازه‌ای دارد که نصب را ناموفق می‌کند؛ برای پایداری، `packageManager` روی pnpm 10.34.5 (LTS واقعی اکوسیستم) قفل شد.
6. **جزئیات متنی موک:** چون فاز ۰ داده‌ی واقعی ندارد، تاریخ‌های نسبی (مثلاً «۲ ساعت پیش») و نام مدل‌ها به‌صورت استاتیک در فایل چت نوشته شده‌اند — در فاز ۲/۳ از DB می‌آیند.

## 4. اجرای پروژه به‌صورت محلی
```bash
pnpm install        # نصب وابستگی‌ها
pnpm dev            # http://localhost:3000
# یا نسخه‌ی پروداکشن:
pnpm build && pnpm start
```
- مسیرها: `/` (هیرو) — `/login` (ورود نمایشی) — `/chat` (شِل چت موک)
- **هیچ متغیر محیطی برای فاز ۰ لازم نیست.** `.env.example` فقط نقشه‌ی فازهای بعدی است.
- نیازی به Postgres نیست — Prisma فعلاً فقط فایل اسکیماست.

## 5. نتیجه‌ی بررسی‌ها
| بررسی | نتیجه |
|---|---|
| `pnpm build` | ✅ پاس — ۳ روت استاتیک (`/`, `/login`, `/chat`) |
| `pnpm lint` | ✅ پاس — صفر خطا/هشدار |
| `pnpm typecheck` (`tsc --noEmit`) | ✅ پاس |
| تست مرورگری (Agent Browser) | ✅ سه روت رندر می‌شوند؛ اسپاتلایت بین آیتم‌ها سُر می‌خورد؛ گام‌های ورود و OTP کار می‌کنند |

## 6. ساختار فایل‌ها
```
arka/
├── docs/
│   ├── SPEC.md              # فایل مشخصات (بخش ۰ تا ۱۲)
│   └── PHASE_0_REPORT.md    # همین گزارش
├── prisma/
│   └── schema.prisma        # اسکیمای بخش ۲ — بدون اتصال به DB
├── src/
│   ├── app/
│   │   ├── layout.tsx       # RTL، فونت لوکال، متادیتا
│   │   ├── page.tsx         # هیرو (بخش ۶)
│   │   ├── globals.css      # توکن‌های بخش ۱۰ + انیمیشن‌ها
│   │   ├── icon.svg
│   │   ├── login/page.tsx   # ورود UI-only (بخش ۷.۱)
│   │   └── chat/page.tsx    # شِل چت موک + دموی اسپاتلایت
│   ├── components/
│   │   ├── reveal.tsx            # IntersectionObserver reveal
│   │   ├── spotlight-list.tsx    # باکس اسپاتلایت RTL-safe
│   │   ├── otp-input.tsx         # OTP شش‌باکسی paste-friendly
│   │   ├── model-picker.tsx      # انتخاب‌گر مدل گروه‌بندی‌شده
│   │   └── ui/                   # button / input / card (shadcn-style)
│   ├── fonts/               # Vazirmatn 400/500/600 + OFL.txt
│   └── lib/utils.ts         # cn()
├── components.json          # پیکربندی shadcn برای فازهای بعد
├── .env.example             # نقشه‌ی متغیرهای فازهای بعد
└── package.json
```

## 7. نکات فاز بعد (فاز ۱)
- اتصال واقعی PostgreSQL و `prisma generate/db push`.
- Auth.js با Google Provider + Credentials OTP سفارشی (جدول `EmailOtp` آماده است).
- قالب HTML ایمیل کد (بخش ۷.۲) و ارسال با Resend/SMTP.
- ادغام حساب‌ها بر اساس `email` (بخش ۳.۱) — فیلد یکتا آماده است.
