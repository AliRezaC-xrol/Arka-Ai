# راهنمای جامع استقرار سرور آرکا (Private Repo Installation Guide)

این راهنما فرآیند کامل راه‌اندازی، اتصال به ریپازیتوری خصوصی GitHub، تنظیمات امنیتی، دیتابیس PostgreSQL، وب‌سرور Nginx و اجرای تولیدی با PM2 را گام‌به‌گام توضیح می‌دهد.

---

## ۱. الزامات سرور (Server Prerequisites)

سیستم‌عامل پیشنهادی: **Ubuntu 22.04 LTS** یا **Ubuntu 24.04 LTS** با حداقل ۲ گیگابایت رم و ۲ هسته پردازنده.

### بسته‌های پایه مورد نیاز:
- **Node.js**: نسخه ۲۰ یا ۲۲ LTS
- **Package Manager**: pnpm نسخه ۹ به بالا (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL**: نسخه ۱۶ یا ۱۷
- **Nginx**: نسخه پایدار لینوکس
- **Git** و **Certbot** (برای صدور گواهینامه رایگان SSL Let's Encrypt)
- **PM2**: برای اجرای دائمی در حالت Cluster

```bash
# به‌روزرسانی مخازن اوبونتو
sudo apt update && sudo apt upgrade -y

# نصب ابزارهای پایه و Nginx و Certbot
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# نصب Node.js 20 LTS از مخزن رسمی NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# فعال‌سازی Corepack و pnpm
sudo corepack enable
sudo corepack prepare pnpm@latest --activate

# نصب سراسری PM2
sudo npm install -g pm2
```

### نصب و آماده‌سازی دیتابیس PostgreSQL:
```bash
sudo apt install -y postgresql postgresql-contrib

# ساخت کاربر و دیتابیس arka
sudo -u postgres psql -c "CREATE USER arka WITH PASSWORD 'YourStrongDbPasswordHere';"
sudo -u postgres psql -c "CREATE DATABASE arka OWNER arka;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE arka TO arka;"
```

---

## ۲. کلون امن از ریپازیتوری خصوصی GitHub (Private Repo Setup)

برای جلوگیری از ثبت پسورد یا Personal Access Token (PAT) در `~/.bash_history` و نشست‌های شل، یکی از دو روش زیر را به کار ببرید:

### روش اول: کلید اختصاصی سرور (SSH Deploy Key) — روش پیشنهادی و امن‌ترین
۱. در سرور یک جفت کلید SSH جدید ایجاد کنید:
```bash
ssh-keygen -t ed25519 -C "deploy@arka.ai" -f ~/.ssh/arka_deploy -N ""
```

۲. محتوای کلید عمومی را کپی کنید:
```bash
cat ~/.ssh/arka_deploy.pub
```

۳. در GitHub به مسیر ریپازیتوری خصوصی خود بروید:
   `Settings` > `Deploy keys` > `Add deploy key`
   - عنوان: `Production Server - Arka`
   - کلید عمومی کپی‌شده را پیست کرده و فقط تیک خواندن (Read-only) را فعال نگه دارید (نیازی به Write access نیست).

۴. کانفیگ SSH سرور را تنظیم کنید:
```bash
cat << 'EOF' >> ~/.ssh/config
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/arka_deploy
    IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config ~/.ssh/arka_deploy
```

۵. کلون پروژه در دایرکتوری مقصد:
```bash
sudo mkdir -p /var/www/arka
sudo chown -R $USER:$USER /var/www/arka
git clone git@github.com:YourOrgOrUser/arka.git /var/www/arka
cd /var/www/arka
```

### روش دوم: استفاده از Personal Access Token (PAT) بدون نشت در Shell History
اگر از توکن استفاده می‌کنید، هرگز توکن را در دستور `git clone https://username:TOKEN@github.com/...` تایپ نکنید زیرا در لاگ سرور و `history` ذخیره می‌شود. در عوض:

```bash
# فعال‌سازی ذخیره‌سازی موقت اعتبارسنجی در حافظه رم (به مدت ۱۵ دقیقه)
git config --global credential.helper 'cache --timeout=900'

# اجرای کلون عادی؛ گیت نام کاربری و توکن را به صورت امن و غیرقابل نمایش می‌پرسد
git clone https://github.com/YourOrgOrUser/arka.git /var/www/arka
cd /var/www/arka
```

---

## ۳. تنظیم متغیرهای محیطی (`.env`)

فایل نمونه را کپی کرده یا یک فایل `.env` جدید ایجاد کنید:

```bash
cd /var/www/arka
nano .env
```

محتوای نمونه برای محیط سرور:
```env
NODE_ENV=production
PORT=3000

# دیتابیس محلی سرور
DATABASE_URL="postgresql://arka:YourStrongDbPasswordHere@localhost:5432/arka?schema=public"

# آدرس دامنه اصلی متصل به سرور
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# کلید رمزنگاری نشست کاربر (رشته تصادفی حداقل ۳۲ کاراکتر)
SESSION_SECRET="e45a2781b0f92c10a48d3c52e1f409ab67c29381e05d93ab491c83401567baec"

# کلید رمزنگاری متقارن AES-256-GCM برای کلیدهای API (دقیقاً ۶۴ کاراکتر هگزادسیمال = ۳۲ بایت)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# پسورد پنل مخفی ادمین (/c-xroladi1n)
ADMIN_PANEL_PASSWORD="YourStrongAdminMasterPassword2026"

# تنظیمات ورود فقط با گوگل (از Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-client-secret"
```

> **نکته امنیتی:** برای تولید کلید‌های امن تصادفی در لینوکس می‌توانید از دستور زیر استفاده کنید:
> ```bash
> openssl rand -hex 32
> ```

---

## ۴. نصب وابستگی‌ها، مایگریشن و بیلد (Build)

```bash
cd /var/www/arka

# نصب تمام وابستگی‌ها
pnpm install --frozen-lockfile

# تولید کلاینت پریزما و ساخت جداول در دیتابیس
pnpm prisma generate
pnpm prisma db push

# کامپایل بهینه Next.js
pnpm run build
```

---

## ۵. اجرای پایدار با PM2

فایل `ecosystem.config.js` در ریشه پروژه قرار دارد. برای راه‌اندازی فرآیند تولیدی:

```bash
cd /var/www/arka

# راه‌اندازی کلاستر Next.js
pm2 start ecosystem.config.js

# ذخیره لیست سرویس‌ها جهت اجرای خودکار پس از ریبوت سرور
pm2 save
pm2 startup
# (دستور خروجی داده‌شده توسط pm2 startup را کپی و با sudo اجرا کنید)
```

دستورات کاربردی PM2:
- وضعیت فرآیند: `pm2 status`
- لاگ‌های زنده: `pm2 logs arka`
- ریستارت بدون قطعی چت (Zero-Downtime Reload): `pm2 reload arka`

---

## ۶. کانفیگ وب‌سرور Nginx و هدرهای امنیتی

یک فایل پیکربندی برای دامنه خود ایجاد کنید:

```bash
sudo nano /etc/nginx/sites-available/arka
```

محتوای فایل پیکربندی:
```nginx
# هدایت ترافیک HTTP به HTTPS (توسط سرتبات تکمیل خواهد شد)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # مسیر پاسخ به چالش‌های Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # مسیر فایل‌های گواهینامه SSL (توسط Certbot تکمیل می‌شود)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # هدرهای امنیتی سخت‌گیرانه (Security Headers)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # فشرده‌سازی Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # ریورس پروکسی به پورت 3000 Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # تنظیمات WebSocket و استریم بلادرنگ (SSE)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # غیرفعال‌سازی کش و بافرینگ جهت استریم پاسخ مدل‌های هوش مصنوعی بدون وقفه
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    # فایل‌های استاتیک عمومی با کش بهینه
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

فعال‌سازی کانفیگ در Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/arka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ۷. صدور رایگان گواهینامه SSL با Certbot

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
```

تست تمدید خودکار گواهینامه:
```bash
sudo certbot renew --dry-run
```

---

## ۸. اسکریپت مدیریت سرور (`arka-cli`)

جهت مدیریت خودکار، نصب آسان، تغییر رمز ادمین، اتصال دامنه و تمدید SSL، اسکریپت آماده در مسیر `scripts/arka-cli.sh` تعبیه شده است:

```bash
sudo chmod +x /var/www/arka/scripts/arka-cli.sh
sudo ln -sf /var/www/arka/scripts/arka-cli.sh /usr/local/bin/arka-cli
```

سپس در هر نقطه از ترمینال سرور دستور زیر را تایپ کنید:
```bash
arka-cli
```
منوی گرافیکی و شماره‌دار ارکا برای تمام عملیات سرور اجرا خواهد شد.
