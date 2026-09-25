<div align="center" dir="rtl">

# ⚡ ARKA AI — پلتفرم متمرکز و پیشرفته هوش مصنوعی

### سامانه یکپارچه گفت‌وگو، تولید تصویر و کلاستر چندمدلی هوش مصنوعی

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary%20%2F%20Closed%20Source-red.svg?style=for-the-badge)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Security: AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM-green.svg?style=for-the-badge)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

---

### ⚠️ اخطار مالکیت معنوی و انحصار نرم‌افزار (Strictly Closed-Source & Proprietary)
> **این پروژه کاملاً انحصاری، سورس‌بسته (Closed-Source) و محرمانه است.**  
> تمامی حقوق مادی و معنوی، کدهای منبع، معماری سیستم، طراحی رابط کاربری و دارایی‌های این مخزن به صورت رسمی و قانونی متعلق به **AliRezaC-xrol** می‌باشد.  
> هرگونه کپی‌برداری، بازتوزیع، تغییر، فروش، انتشار به صورت متن‌باز، مهندسی معکوس یا دی‌کامپایل این نرم‌افزار، به هر نحو و در هر رسانه‌ای، بدون اجازه کتبی و قبلی مالک اکیداً ممنوع بوده و مشمول پیگرد بین‌المللی و قانونی است.

</div>

---

## فهرست مطالب (Table of Contents)

1. [معرفی پروژه و اهداف ارکا](#-معرفی-پروژه-و-اهداف-ارکا)
2. [ویژگی‌ها و قابلیت‌های برجسته](#-ویژگی‌ها-و-قابلیت‌های-برجسته)
3. [معماری سیستم و پشته فناوری](#-معماری-سیستم-و-پشته-فناوری)
4. [امنیت و رمزنگاری داده‌ها](#-امنیت-و-رمزنگاری-داده‌ها)
5. [راهنمای جامع نصب و راه‌اندازی روی سرور (Ubuntu)](#-راهنمای-جامع-نصب-و-راه‌اندازی-روی-سرور-ubuntu)
6. [تنظیم متغیرهای محیطی (`.env`)](#-تنظیم-متغیرهای-محیطی-env)
7. [وب‌سرور Nginx، استریم SSE و گواهینامه SSL](#-وب‌سرور-nginx-استریم-sse-و-گواهینامه-ssl)
8. [ابزار خط فرمان مدیریت سرور (`arka-cli`)](#-ابزار-خط-فرمان-مدیریت-سرور-arka-cli)
9. [English Documentation & Technical Specification](#-english-documentation--technical-specification)
10. [متن پروانه نرم‌افزار (Proprietary License)](#-متن-پروانه-نرم‌افزار-proprietary-license)

---

## 📖 معرفی پروژه و اهداف ارکا

**ارکا (ARKA)** یک درگاه یکپارچه و دستیار فوق‌سریع هوش مصنوعی است که دسترسی همزمان و بدون فیلتر به قدرتمندترین مدل‌های زبانی (LLM) و استودیوهای تولید تصویر جهان را در یک محیط بومی، مینیمال (Monochrome) و کاملاً فارسی فراهم می‌کند.

در ارکا، کاربران نیازی به داشتن حساب‌های متعدد خارجی یا خرید اشتراک‌های دلاری مجزا ندارند؛ یا از سهمیه متمرکز سیستم بهره‌مند می‌شوند و یا کلیدهای اختصاصی API خود را متصل کرده و از زیرساخت چندکلیدی و جابجایی خودکار بدون قطعی بهره می‌برند.

---

## ✨ ویژگی‌ها و قابلیت‌های برجسته

### ۱. پشتیبانی از پیشرفته‌ترین مدل‌های هوش مصنوعی دنیا
- **OpenAI:** GPT-4o, GPT-4o mini, o1, o3-mini
- **Anthropic Claude:** Claude 3.7 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Google Gemini:** Gemini 2.5 Pro, Flash 2.5
- **DeepSeek:** DeepSeek R1 (استدلال تحلیلی) و DeepSeek V3
- **xAI Grok:** Grok 2
- **Meta Llama:** Llama 3.3 70B
- **Mistral AI:** Mistral Large 2
- **Perplexity AI:** Sonnar Pro با جستجوی زنده وب
- **FLUX.1 (Black Forest Labs):** استودیوی حرفه‌ای تولید تصویر با هوش مصنوعی

### ۲. معماری کلاستر چندکلیدی و جابجایی خودکار (Auto-Failover)
- اگر یک کلید API با خطای محدودیت نرخ (HTTP 429) یا اتمام سهمیه مواجه شود، سیستم بدون قطع استریم پاسخ، بلافاصله روی کلید رزرو بعدی سوئیچ می‌کند.

### ۳. امنیت در کلاس سازمانی با رمزنگاری کلیدها (BYOK)
- کلیدهای شخصی کاربران با الگوریتم متقارن **AES-256-GCM** و بردار تصادفی ۱۲ بایتی رمز شده و در دیتابیس ذخیره می‌شوند.
- رمزگشایی صرفاً به صورت موقت در حافظه رم سرور در زمان ارسال درخواست صورت می‌گیرد و هرگز به سمت کلاینت ارسال نمی‌گردد.

### ۴. ورود اختصاصی با حساب گوگل (Single-Identity Google OAuth)
- بدون رمز عبور، بدون فرم‌های آسیب‌پذیر و بدون کدهای تاخیری پیامک (OTP).
- ثبت‌نام و ورود تنها با یک کلیک امن از طریق Google OAuth 2.0 با توکن‌های HTTP-only امن.

### ۵. مرکز مدیریت فوق‌پیشرفته (`/c-xroladi1n`)
- آمار لحظه‌ای ترافیک، کاربران فعال و مصرف کلیدها.
- نمودار تایم‌لاین ثبت‌نام‌های جدید با دکمه‌های بازه زمانی ۷ روزه، ۳۰ روزه و ۹۰ روزه.
- مدیریت کاربران: بن دائمی، محدودیت زمانی (Timeout) با تایمر معکوس زنده و مدیریت سهمیه.
- مدیریت استخر کلیدهای عمومی و مدیریت پیام‌های اعلان سراسری (Broadcast).

### ۶. رابط کاربری مدرن با ماک‌آپ‌های اختصاصی دستگاه
- نوار لوگوی بی‌نهایت، روان و بدون مکث از ۹ ارائه‌دهنده با آیکون‌های وکتور واقعی برندها.
- هیرو ریسپانسیو هوشمند: در مانیتور و تبلت به صورت ماک‌آپ لپ‌تاپ (MacBook) و در موبایل به صورت ماک‌آپ گوشی (iPhone) نمایش داده می‌شود.

---

## 🛠 معماری سیستم و پشته فناوری

| بخش | فناوری مورد استفاده |
| :--- | :--- |
| **فرانت‌اند و فریم‌ورک** | Next.js 15 (React 19, Server Components, App Router) |
| **زبان برنامه‌نویسی** | TypeScript 5 (Strict Mode) |
| **استایل‌دهی و انیمیشن** | Tailwind CSS 4, Lucide Icons, Canvas 2D Mesh Animation |
| **پایگاه داده و نگاشت** | PostgreSQL 17 + Prisma ORM |
| **امنیت نشست و هش** | Jose (JWT), Web Crypto API, AES-256-GCM, PBKDF2 |
| **مدیریت پروسه‌های سرور** | PM2 Cluster Manager |
| **وب‌سرور ریورس پروکسی** | Nginx (تنظیم‌شده برای SSE Stream و WebSocket) |

---

## 🔐 امنیت و رمزنگاری داده‌ها

سامانه ارکا بر پایه اصل «حداقل افشا» (Zero-Trust Data Exposure) طراحی شده است:
1. **رمزنگاری کلیدهای API:** هر کلید با استفاده از `AES-256-GCM`، بردار `IV` منحصر‌به‌فرد و تگ اعتبارسنجی ۱۶ بایتی محافظت می‌شود.
2. **کوکی‌های نشست ایمن:** نشست کاربر با فلگ‌های `httpOnly`، `SameSite=Lax` و `Secure` رمز شده و در برابر حملات XSS و CSRF کاملاً مصون است.
3. **مایگریشن‌های اتمیک:** تمامی تراکنش‌های حساس کاربران و کلاسترها با تراکنش‌های اتمیک Prisma انجام می‌پذیرد تا تداخل رخ ندهد.

---

## 🚀 راهنمای جامع نصب و راه‌اندازی روی سرور (Ubuntu)

### مرحله ۱: پیش‌نیازهای سرور اوبونتو
سیستم‌عامل پیشنهادی: **Ubuntu 22.04 LTS** یا **Ubuntu 24.04 LTS**.
دستورات زیر را برای نصب پکیج‌های مورد نیاز اجرا کنید:

```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب ابزارهای پایه و Nginx
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# نصب Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# نصب ابزار PM2
sudo npm install -g pm2
```

---

### مرحله ۲: نصب و راه‌اندازی دیتابیس PostgreSQL

```bash
# نصب PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# ساخت کاربر و پایگاه داده arka
sudo -u postgres psql -c "CREATE USER arka WITH PASSWORD 'YourStrongDbPasswordHere' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE arka OWNER arka;"
```

---

### مرحله ۳: کلون سورس‌کد و آماده‌سازی مسیر

```bash
# ایجاد دایرکتوری در وب‌سرور
sudo mkdir -p /var/www/arka
sudo chown -R $USER:$USER /var/www/arka

# کلون پروژه
git clone https://github.com/AliRezaC-xrol/arka.git /var/www/arka
cd /var/www/arka
```

---

### مرحله ۴: تنظیم متغیرهای محیطی (`.env`)

فایل نمونه را کپی کرده و مقادیر مورد نظر خود را در آن وارد نمایید:

```bash
cp .env.example .env
nano .env
```

نمونه پیکربندی فایل `.env`:
```env
NODE_ENV=production
PORT=3000

# دیتابیس PostgreSQL
DATABASE_URL="postgresql://arka:YourStrongDbPasswordHere@localhost:5432/arka?schema=public"

# آدرس دامنه اصلی
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# تولید کلیدهای ۳۲ بایتی تصادفی با: openssl rand -hex 32
SESSION_SECRET="d54a73e6b912c40ef87a1d305649b1ca8234e7019f6a73c09b8e21f4560d78ef"
BYOK_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# گذرواژه ورود به پنل مخفی ادمین (/c-xroladi1n)
ADMIN_PANEL_PASSWORD="YourSecretMasterPassword2026"

# تنظیمات احراز هویت با گوگل (Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-secret"
```

---

### مرحله ۵: نصب وابستگی‌ها، همگام‌سازی دیتابیس و بیلد

```bash
cd /var/www/arka

# نصب بسته‌های npm
npm ci

# اعمال جداول در دیتابیس با Prisma
npx prisma generate
npx prisma db push

# کامپایل بهینه پروداکشن Next.js
npm run build
```

---

### مرحله ۶: اجرای دائمی سرویس با PM2

```bash
# راه‌اندازی با تنظیمات اختصاصی کلاستر
pm2 start ecosystem.config.js

# ثبت اجرای خودکار پس از روشن شدن سرور
pm2 save
pm2 startup
```

---

## 🌐 وب‌سرور Nginx، استریم SSE و گواهینامه SSL

### ایجاد پیکربندی Nginx برای دامنه
فایل پیکربندی را ایجاد کنید:
```bash
sudo nano /etc/nginx/sites-available/arka
```

محتوای زیر را قرار دهید (`yourdomain.com` را با دامنه خود جایگزین کنید):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # تنظیمات WebSocket و هدرهای فوروارد
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # بسیار حیاتی: غیرفعال‌سازی بافر برای استریم بدون وقفه پاسخ‌های هوش مصنوعی
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    # کش استاتیک فایل‌های بیلد
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

فعال‌سازی و بارگذاری مجدد:
```bash
sudo ln -sf /etc/nginx/sites-available/arka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### دریافت گواهینامه رایگان SSL با Certbot
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 💻 ابزار خط فرمان مدیریت سرور (`arka-cli`)

ارکا مجهز به یک رابط ترمینالی تعاملی ۷ گزینه‌ای است:

```bash
# ایجاد لینک اجرایی
sudo chmod +x /var/www/arka/scripts/arka-cli.sh
sudo ln -sf /var/www/arka/scripts/arka-cli.sh /usr/local/bin/arka-cli

# اجرا در هر کجای سرور:
arka-cli
```

**امکانات منوی `arka-cli`:**
- [1] نصب خودکار و کامل پروژه (Full Install)
- [2] توقف و حذف کامل سرویس‌ها (Full Uninstall)
- [3] اتصال دامنه، کانفیگ Nginx و دریافت خودکار SSL
- [4] تعریف گذرواژه پنل مدیریت برای بار اول
- [5] تغییر گذرواژه پنل مدیریت با احراز هویت
- [6] بررسی انقضا و تمدید گواهینامه SSL
- [7] خروج

---

## 🛡 English Documentation & Technical Specification

### Overview
**ARKA** is a high-availability, unified multi-model AI platform featuring hardware-accelerated AES-256-GCM BYOK encryption, automatic key failover orchestration, single-identity Google OAuth, and an enterprise administration hub.

### Security Highlights
- **Envelope Encryption**: API keys are encrypted at rest with AES-256-GCM utilizing 12-byte initialization vectors and 16-byte authentication tags.
- **Zero-Storage Decryption**: Key decryption occurs solely within volatile server memory during the lifecycle of an outbound stream.
- **Failover Engine**: Catches HTTP 429 and rate-limit responses to hot-swap to active backup keys in the provider pool without terminating client connection.
- **Strictly Closed-Source**: Proprietary intellectual property of AliRezaC-xrol. All unauthorized copying, reverse engineering, and redistribution are legally prohibited.

---

## 📜 متن پروانه نرم‌افزار (Proprietary License)

```text
PROPRIETARY AND CONFIDENTIAL SOURCE CODE LICENSE

Copyright (c) 2026 AliRezaC-xrol / ARKA AI (https://github.com/AliRezaC-xrol/arka)
All Rights Reserved.

STRICTLY CLOSED-SOURCE AND PROPRIETARY SOFTWARE

This software, its source code, documentation, algorithms, architecture, design assets,
and compiled binaries (collectively, the "Software") are the exclusive proprietary property
of AliRezaC-xrol and ARKA.

No individual or legal entity may copy, reproduce, mirror, republish, download, distribute,
transmit, broadcast, sell, rent, lease, license, sublicense, or otherwise exploit this
Software, in whole or in part, without the prior express written consent of AliRezaC-xrol.
```
