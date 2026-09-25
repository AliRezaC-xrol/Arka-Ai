# گزارش جامع فاز ۵: پنل ادمین — مدیریت پروایدرها، جابجایی خودکار کلیدها (Failover) و تحلیل مصرف

**تاریخ اجرا:** ۲۵ سپتامبر ۲۰۲۶  
**موقعیت:** سامانه هوش مصنوعی آرکا (ARKA AI Studio)  
**وضعیت فاز:** تکمیل ۱۰۰٪ — تمامی ۴۵ مورد آزمون با موفقیت پاس شدند (۴۵/۴۵ Passed)

---

## ۱. اهداف و دستاوردهای کلیدی فاز ۵

در این فاز، زیرساخت چندکلیدی و کلاسترینگ پروایدرهای متمرکز سایت به همراه موتور تاب‌آوری و سوییچ خودکار کلیدها (Auto-Failover) و داشبورد تحلیل و آمار مصرف توکن‌ها پیاده‌سازی شد:

1. **تفکیک پروایدرهای سایت از پروایدرهای شخصی:**
   - پروایدرهای پیکربندی‌شده توسط ادمین به صورت متمرکز برای تمامی کاربران سرویس‌دهی می‌کنند.
   - نام اختصاصی تعریف‌شده توسط مدیر مستقیماً در منوی انتخاب مدل (`ModelPicker`) برای کاربران ظاهر می‌شود.
2. **پشتیبانی از چندین کلید API برای هر پروایدر (Multi-Key Cluster):**
   - قابلیت ثبت چندین کلید برای هر پروایدر با برچسب (Label)، ماسک امنیتی (`sk-...1234`)، وضعیت (`active` / `exhausted` / `error`)، تعداد استفاده (`usageCount`) و تاریخ آخرین فراخوانی.
3. **موتور جابجایی خودکار کلیدها در صورت خطا (Zero-Downtime Failover):**
   - در صورت اتمام سهمیه یا محدودیت نرخ (429 Too Many Requests / Quota Exceeded / Rate Limit)، کلید جاری به عنوان `exhausted` علامت‌گذاری شده و بدون کوچک‌ترین اختلال در تجربه کاربر، درخواست فوراً با کلید فعال بعدی پردازش می‌شود.
   - کلیدهای معیوب هرگز حذف نمی‌شوند؛ بلکه از صف انتخاب خارج شده و مدیر می‌تواند پس از شارژ مجدد با یک کلیک آن‌ها را فعال کند.
   - الگوریتم انتخاب کلید بر پایه کمترین استفاده (`Least-Used`) جهت توزیع بهینه بار است.
4. **مدیریت مدل‌های پروایدر:**
   - مدیر مدل‌های در دسترس هر پروایدر را تعریف می‌کند (مانند `gpt-4o, gpt-4o-mini`).
   - مدل‌ها بلافاصله در `ModelPicker` ظاهر می‌شوند و با غیرفعال‌سازی پروایدر فوراً پنهان می‌گردند.
5. **داشبورد تحلیل مصرف (Usage Analytics):**
   - تجمیع مصرف توکن‌ها بر اساس بازه‌های ۲۴ ساعت (روز)، ۷ روز (هفته) و ۳۰ روز (ماه).
   - نمودار میله‌ای مقایسه‌ای مصرف پروایدرها.
   - شناسایی پرمصرف‌ترین پروایدر و محبوب‌ترین مدل هوش مصنوعی.
   - رتبه‌بندی کاربران برتر هر پروایدر بر اساس حجم توکن‌های مصرفی و تعداد درخواست‌ها.
6. **امنیت و حذف با تأییدیه:**
   - تمامی روت‌های مدیریتی پروایدرها در صورت عدم احراز هویت ادمین کد `404 Not Found` بازمی‌گردانند (مسیرهای مخفی).
   - حذف پروایدر نیازمند دیالوگ تأییدیه با اخطار شفاف درباره حذف کلیدها و سوابق مصرف است.

---

## ۲. مدل‌های پایگاه‌داده (Prisma Schema)

سه جدول تخصصی در PostgreSQL ایجاد و ایندکس‌گذاری شدند:

```prisma
model Provider {
  id        String            @id @default(uuid())
  name      String            // نام اختصاصی نمایشی در ModelPicker
  type      String            // openai, anthropic, google, deepseek, custom
  baseUrl   String?           @map("base_url")
  isActive  Boolean           @default(true) @map("is_active")
  models    String            // مدل‌های فعال به صورت رشته کاما-جدا
  createdAt DateTime          @default(now()) @map("created_at")
  updatedAt DateTime          @updatedAt @map("updated_at")

  apiKeys   ProviderApiKey[]
  usageLogs UsageLog[]

  @@map("providers")
}

model ProviderApiKey {
  id               String    @id @default(uuid())
  providerId       String    @map("provider_id")
  encryptedApiKey  String    @map("encrypted_api_key") // AES-256-GCM
  keyMask          String    @map("key_mask")          // نمایش امن UI (e.g. sk-...a1b2)
  label            String    @default("کلید اصلی")
  status           String    @default("active")        // active | exhausted | error
  lastUsedAt       DateTime? @map("last_used_at")
  lastErrorMessage String?   @map("last_error_message")
  usageCount       Int       @default(0) @map("usage_count")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  provider         Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId, status])
  @@map("provider_api_keys")
}

model UsageLog {
  id               String   @id @default(uuid())
  userId           String?  @map("user_id")
  providerId       String   @map("provider_id")
  model            String
  promptTokens     Int      @default(0) @map("prompt_tokens")
  completionTokens Int      @default(0) @map("completion_tokens")
  tokensUsed       Int      @default(0) @map("tokens_used")
  createdAt        DateTime @default(now()) @map("created_at")

  user     User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId, createdAt])
  @@index([userId, createdAt])
  @@map("usage_logs")
}
```

---

## ۳. اجزا و ماژول‌های توسعه‌داده‌شده

### الف) موتور چرخش و تاب‌آوری کلیدها (`src/lib/provider-failover.ts`)
- تابع `executeWithFailover(options)`:
  - استعلام کلیدهای وضعیت `active` برای پروایدر، مرتب‌شده بر اساس `usageCount ASC` و `lastUsedAt ASC`.
  - رمزگشایی در لحظه با استفاده از AES-256-GCM.
  - گرفتن خطاهای 429 و Quota Exceeded و علامت‌گذاری خودکار کلید به عنوان `exhausted` با ذخیره علت خطا در دیتابیس.
  - سوییچ فوری به کلید بعد بدون ایجاد وقفه یا خطا برای کاربر.
  - ثبت لاگ مصرف در `usage_logs` و به‌روزرسانی شمارنده `usageCount` و تاریخ `lastUsedAt`.

### ب) اندپوینت‌های API مدیریتی و کاربری
1. `GET /api/admin/providers`: دریافت لیست پروایدرها با کلیدها و آمار مصرف (محافظت‌شده با 404).
2. `POST /api/admin/providers`: ایجاد پروایدر جدید به همراه کلید اولیه اختیاری.
3. `PATCH /api/admin/providers/[id]`: ویرایش مشخصات یا تاگل وضعیت فعال/غیرفعال (`isActive`).
4. `DELETE /api/admin/providers/[id]`: حذف آبشاری پروایدر، کلیدها و لاگ‌های مصرف.
5. `POST /api/admin/providers/[id]/keys`: افزودن کلید جدید به کلاستر یک پروایدر.
6. `PATCH /api/admin/providers/[id]/keys/[keyId]`: تغییر وضعیت کلید (مانند فعال‌سازی مجدد کلید `exhausted`).
7. `DELETE /api/admin/providers/[id]/keys/[keyId]`: حذف کلید از پروایدر.
8. `GET /api/admin/usage`: تجمیع مصرف توکن‌ها، مقایسه پروایدرها، برترین مدل و برترین کاربران در بازه روز، هفته و ماه.
9. `GET /api/site-providers`: اندپوینت عمومی فاقد کلید جهت واکشی پروایدرهای فعال برای `ModelPicker`.
10. `POST /api/chat`: یکپارچه‌سازی کامل استریم با موتور `executeWithFailover`.

### ج) رابط کاربری پنل مدیریت (`src/components/admin/providers-manager.tsx`)
- تب «پروایدرها و کلیدها» در سایدبار پنل ادمین (`/c-xroladi1n`).
- کارت‌های پیشرفته برای هر پروایدر شامل سوییچ تاگل وضعیت، نوع، مدل‌ها، وضعیت سلامت کلیدها (فعال/پایان سهمیه/خطادار).
- لیست آکاردئونی کلیدها با امکان فعال‌سازی مجدد، حذف و افزودن کلید جدید.
- باکس تحلیل مصرف با بازه‌های ۲۴ ساعت، ۷ روز و ۳۰ روز.
- نمودار میله‌ای مقایسه‌ای پروایدرها و قابلیت کلیک روی هر پروایدر برای فیلتر کاربران اختصاصی آن.
- دیالوگ‌های مودال برای افزودن، ویرایش و تأیید حذف با اخطار شفاف.

---

## ۴. چک‌لیست اعتبارسنجی و نتایج آزمون‌ها (`scripts/test-phase5.ts`)

آزمون خودکار شامل **۴۵ مورد تست جامع** اجرا شد و تمامی موارد تأیید شدند:

| ردیف | شرح آزمون | وضعیت |
|:---:|:---|:---:|
| ۱ | ورود ادمین با سشن معتبر و مسدودسازی روت‌ها با ۴۰۴ برای کاربران احرازهویت‌نشده | ✅ پاس شد |
| ۲ | ایجاد پروایدر سایت با ۲ کلید API (کلید اولیه + کلید دوم) با رمزنگاری AES-256 | ✅ پاس شد |
| ۳ | نمایش پروایدر در API عمومی `/api/site-providers` بدون افشای کلیدهای API | ✅ پاس شد |
| ۴ | ارسال پیام چت واقعی توسط کاربر با استفاده از پروایدر متمرکز سایت و استریم پاسخ | ✅ پاس شد |
| ۵ | شبیه‌سازی خطای اتمام موجودی (429 Quota Exceeded) روی کلید اول | ✅ پاس شد |
| ۶ | سوییچ خودکار در لحظه (Auto-Failover) به کلید دوم با صفر اختلال برای کاربر | ✅ پاس شد |
| ۷ | علامت‌گذاری کلید خطادار به عنوان `exhausted` در دیتابیس بدون حذف فیزیکی آن | ✅ پاس شد |
| ۸ | فعال ماندن کلید دوم و افزایش شمارنده استفاده (`usageCount`) آن | ✅ پاس شد |
| ۹ | ثبت دقیق توکن‌های ورودی/خروجی و کل در جدول `usage_logs` | ✅ پاس شد |
| ۱۰ | محاسبه دقیق مجموع توکن‌ها و درخواست‌ها در بازه زمانی انتخابی | ✅ پاس شد |
| ۱۱ | تعیین پرمصرف‌ترین پروایدر و محبوب‌ترین مدل در بازه انتخابی | ✅ پاس شد |
| ۱۲ | استخراج لیست برترین کاربران مصرف‌کننده هر پروایدر به صورت مرتب‌شده | ✅ پاس شد |
| ۱۳ | غیرفعال‌سازی پروایدر (`isActive: false`) و ناپدید شدن فوری از `ModelPicker` | ✅ پاس شد |
| ۱۴ | حفظ کامل سوابق و لاگ‌های مصرف پس از غیرفعال‌سازی پروایدر | ✅ پاس شد |
| ۱۵ | فعال‌سازی مجدد کلید `exhausted` توسط ادمین و پاک شدن پیام خطای قبلی | ✅ پاس شد |
| ۱۶ | حذف قطعی پروایدر با حذف آبشاری تمام کلیدها و رکوردهای وابسته | ✅ پاس شد |

### خلاصه کلی رگرسیون کل سیستم:
- فاز ۱ (احراز هویت گوگل و سشن‌ها): ۲۰/۲۰ پاس شد.
- فاز ۲ (محیط چت و استریمینگ): ۲۳/۲۳ پاس شد.
- فاز ۳ (پروایدرهای شخصی کاربران): ۱۹/۱۹ پاس شد.
- فاز ۴ (داشبورد ادمین و لاگین امنیتی): ۲۳/۲۳ پاس شد.
- فاز ۵ (مدیریت پروایدرهای سایت و فیل‌اور): ۴۵/۴۵ پاس شد.
- **مجموع آزمون‌های خودکار سامانه:** ۱۳۰ از ۱۳۰ پاس شد (۱۰۰٪ موفقیت).
