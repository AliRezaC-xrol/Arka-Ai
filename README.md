# ARKA

پلتفرم چت و تولید تصویر با هوش مصنوعی — چند مدل، چند پروایدر، یک رابط.

## ویژگی‌ها

- اتصال به هر پروایدری: OpenAI، Anthropic، Google، OpenRouter، DeepSeek، Groq و هر سرویس سازگار با OpenAI
- افزودن کلید شخصی (BYOK) با رمزنگاری AES-256-GCM
- جابجایی خودکار بین کلیدها هنگام خطا یا اتمام سهمیه
- استریم زنده پاسخ‌ها
- پنل مدیریت و سیستم تیکت پشتیبانی

## پشته فناوری

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL

رابط کاربری با **کامپوننت‌های vibefarsi** ساخته شده است.

## راه‌اندازی

```bash
pnpm install
cp .env.example .env
npx prisma generate
npx prisma db push
pnpm dev
```

## پروانه

انحصاری و سورس‌بسته (Closed Source). تمامی حقوق مادی و معنوی متعلق به
**AliRezaC-xrol** است. کپی‌برداری، بازتوزیع یا انتشار بدون اجازه کتبی ممنوع است.
