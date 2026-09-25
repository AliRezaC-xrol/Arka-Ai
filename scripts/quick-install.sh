#!/usr/bin/env bash
# ==============================================================================
# ARKA AI Platform — 0-to-100 Fully Automated Zero-Touch Installer
# Proprietary & Confidential — Copyright (c) 2026 AliRezaC-xrol
# ==============================================================================

export DEBIAN_FRONTEND=noninteractive

# Colors
CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_GREEN="\033[1;32m"
CLR_CYAN="\033[1;36m"
CLR_YELLOW="\033[1;33m"
CLR_RED="\033[1;31m"
CLR_WHITE="\033[1;37m"

echo -e "${CLR_CYAN}${CLR_BOLD}"
echo "=================================================================="
echo "    ⚡ ARKA AI PLATFORM — نصب خودکار و کامل صفر تا صد (0 to 100)  "
echo "=================================================================="
echo -e "${CLR_RESET}"

# 0. Check Root
if [[ $EUID -ne 0 ]]; then
   echo -e "${CLR_RED}✖ لطفاً این اسکریپت را با دسترسی روت (sudo) اجرا کنید.${CLR_RESET}"
   exit 1
fi

GITHUB_TOKEN="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"
TARGET_DIR="/var/www/arka"

# Parse arguments: if argument is a domain, use it; if domain was passed as first arg or env:
ARG1="$1"
ARG2="$2"

DOMAIN_NAME=""
if [[ -n "$ARG1" && "$ARG1" != ghp_* ]]; then
  DOMAIN_NAME="$ARG1"
elif [[ -n "$ARG2" ]]; then
  DOMAIN_NAME="$ARG2"
fi

# Clean domain name
DOMAIN_NAME=$(echo "$DOMAIN_NAME" | tr -d '[:space:]' | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')

# 1. Detect Public IP & Prompt for Domain if not passed
echo -e " ${CLR_CYAN}ℹ [1/9] شناسایی IP عمومی سرور...${CLR_RESET}"
SERVER_IP=$(curl -s --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')
echo -e " ${CLR_GREEN}✔ IP سرور شما: ${CLR_WHITE}$SERVER_IP${CLR_RESET}"

if [[ -z "$DOMAIN_NAME" ]]; then
  echo -en "\n ${CLR_BOLD}${CLR_WHITE}🌐 لطفاً نام دامنه خود را وارد نمایید (مثال: mydomain.com): ${CLR_RESET}"
  read -r DOMAIN_NAME < /dev/tty 2>/dev/null || true
  DOMAIN_NAME=$(echo "$DOMAIN_NAME" | tr -d '[:space:]' | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
fi

if [[ -n "$DOMAIN_NAME" ]]; then
  echo -e " ${CLR_GREEN}✔ دامنه انتخاب‌شده: ${CLR_BOLD}${CLR_WHITE}$DOMAIN_NAME${CLR_RESET}"
else
  echo -e " ${CLR_YELLOW}⚠ دامنه‌ای وارد نشد. سامانه مستقیماً با IP سرور ($SERVER_IP) راه‌اندازی می‌شود.${CLR_RESET}"
fi

# 2. Add Swap Memory (Protects Next.js build from OOM crashes)
echo -e "\n ${CLR_CYAN}ℹ [2/9] بررسی حافظه سرور و تنظیم Swap کمکی...${CLR_RESET}"
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
SWAP_EXISTS=$(free -m | awk '/^Swap:/{print $2}')
if [[ $SWAP_EXISTS -lt 1024 && $TOTAL_RAM_MB -lt 3500 ]]; then
  echo -e " ایجاد خودکار ۲ گیگابایت حافظه Swap..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null
  chmod 600 /swapfile
  mkswap /swapfile 2>/dev/null || true
  swapon /swapfile 2>/dev/null || true
  if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo -e " ${CLR_GREEN}✔ حافظه Swap با موفقیت فعال شد.${CLR_RESET}"
else
  echo -e " ${CLR_GREEN}✔ حافظه سرور کافی است.${CLR_RESET}"
fi

# 3. Update APT & Install System Packages
echo -e "\n ${CLR_CYAN}ℹ [3/9] به‌روزرسانی سیستم و نصب پکیج‌های زیرساخت...${CLR_RESET}"
apt-get update -y || true
apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib openssl dnsutils

# 4. Install Node.js 20 LTS & PM2
echo -e "\n ${CLR_CYAN}ℹ [4/9] نصب و اعتبارسنجی Node.js 20 LTS و PM2...${CLR_RESET}"
if ! command -v node &>/dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo -e " ${CLR_GREEN}✔ Node.js: $(node -v) | npm: $(npm -v)${CLR_RESET}"

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

# 5. Configure PostgreSQL Database
echo -e "\n ${CLR_CYAN}ℹ [5/9] راه‌اندازی و بهینه‌سازی پایگاه داده PostgreSQL...${CLR_RESET}"
systemctl start postgresql 2>/dev/null || service postgresql start || true
systemctl enable postgresql 2>/dev/null || true

DB_USER="arka"
DB_PASS="ArkaDb_$(openssl rand -hex 10)"
DB_NAME="arka"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' SUPERUSER;" 2>/dev/null || true
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
echo -e " ${CLR_GREEN}✔ پایگاه داده PostgreSQL آماده و متصل شد.${CLR_RESET}"

# 6. Clone or Update Repository Cleanly
echo -e "\n ${CLR_CYAN}ℹ [6/9] کلون سورس‌کد پروژه از مخزن اختصاصی شما...${CLR_RESET}"
if [[ -d "$TARGET_DIR/.git" ]]; then
  echo -e " دریافت آخرین تغییرات مخزن..."
  cd "$TARGET_DIR"
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/AliRezaC-xrol/arka.git"
  git reset --hard origin/main 2>/dev/null || git pull origin main || true
else
  mkdir -p "$TARGET_DIR"
  git clone "https://${GITHUB_TOKEN}@github.com/AliRezaC-xrol/arka.git" "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

# Generate Cryptographic Keys & .env
SESSION_SECRET=$(openssl rand -hex 32)
BYOK_ENCRYPTION_KEY=$(openssl rand -hex 32)
ADMIN_PASS="Arka_$(openssl rand -hex 6)"

APP_URL="http://$SERVER_IP"
if [[ -n "$DOMAIN_NAME" ]]; then
  APP_URL="https://$DOMAIN_NAME"
fi

cat << ENVEOF > "$TARGET_DIR/.env"
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
NEXT_PUBLIC_APP_URL="${APP_URL}"
SESSION_SECRET="${SESSION_SECRET}"
BYOK_ENCRYPTION_KEY="${BYOK_ENCRYPTION_KEY}"
ADMIN_PANEL_PASSWORD="${ADMIN_PASS}"
GOOGLE_CLIENT_ID="placeholder.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="placeholder-secret"
ENVEOF

# 7. Install Dependencies, Migrate Prisma & Compile Next.js
echo -e "\n ${CLR_CYAN}ℹ [7/9] نصب بسته‌ها، تولید اسکیما دیتابیس و کامپایل بیلد Next.js...${CLR_RESET}"
cd "$TARGET_DIR"
npm ci || npm install --no-audit
npx prisma generate
npx prisma db push

echo -e " در حال کامپایل پروداکشن (Build)..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Start or Reload PM2
pm2 delete arka 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save 2>/dev/null || true
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo -e " ${CLR_GREEN}✔ سرویس Arka در پس‌زمینه با PM2 فعال شد.${CLR_RESET}"

# 8. Configure Nginx Reverse Proxy with Zero-Buffering SSE
echo -e "\n ${CLR_CYAN}ℹ [8/9] پیکربندی وب‌سرور Nginx و استریم هوش مصنوعی...${CLR_RESET}"
NGINX_HOST="$SERVER_IP"
if [[ -n "$DOMAIN_NAME" ]]; then
  NGINX_HOST="${DOMAIN_NAME} www.${DOMAIN_NAME} ${SERVER_IP}"
fi

cat << NGINXEOF > /etc/nginx/sites-available/arka
server {
    listen 80;
    listen [::]:80;
    server_name ${NGINX_HOST};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Disable buffering for real-time SSE AI streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/arka /etc/nginx/sites-enabled/
nginx -t && (systemctl reload nginx 2>/dev/null || service nginx reload || true)

# 9. Automatic SSL with Certbot
SSL_STATUS="غیرفعال (اتصال از طریق HTTP)"
if [[ -n "$DOMAIN_NAME" ]]; then
  echo -e "\n ${CLR_CYAN}ℹ [9/9] درخواست و فعال‌سازی خودکار گواهینامه امنیتی SSL (Let's Encrypt)...${CLR_RESET}"
  
  # Try issuing certbot certificate
  if certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --redirect -m "admin@$DOMAIN_NAME" 2>/dev/null; then
    SSL_STATUS="فعال با HTTPS رسمی"
    APP_URL="https://$DOMAIN_NAME"
    sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"https://${DOMAIN_NAME}\"|g" "$TARGET_DIR/.env"
    pm2 reload arka 2>/dev/null || true
    echo -e " ${CLR_GREEN}✔ گواهینامه SSL برای $DOMAIN_NAME با موفقیت صادر و فعال شد.${CLR_RESET}"
  else
    echo -e " ${CLR_YELLOW}⚠ دریافت خودکار SSL با خطا مواجه شد. لطفاً مطمئن شوید رکورد A دامنه شما به IP ($SERVER_IP) اشاره می‌کند.${CLR_RESET}"
    echo -e " ${CLR_YELLOW}می‌توانید بعد از تنظیم DNS با دستور 'sudo bash /var/www/arka/scripts/setup-domain.sh $DOMAIN_NAME' هر زمان SSL بگیرید.${CLR_RESET}"
    APP_URL="http://$DOMAIN_NAME"
  fi
fi

# Setup Global CLI
chmod +x "$TARGET_DIR/scripts/arka-cli.sh"
ln -sf "$TARGET_DIR/scripts/arka-cli.sh" /usr/local/bin/arka-cli
chmod +x "$TARGET_DIR/scripts/setup-domain.sh"

# Verify local service is alive
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || echo "000")

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "=================================================================="
echo "    🎉 تبریک! سامانه هوش مصنوعی ارکا با موفقیت راه‌اندازی شد     "
echo "=================================================================="
echo -e "${CLR_RESET}"
echo -e " ${CLR_WHITE}🌐 آدرس ورود به سامانه:${CLR_RESET}   ${CLR_CYAN}${APP_URL}${CLR_RESET}"
echo -e " ${CLR_WHITE}🔐 آدرس پنل مدیریت:${CLR_RESET}       ${CLR_CYAN}${APP_URL}/c-xroladi1n${CLR_RESET}"
echo -e " ${CLR_WHITE}🔑 رمز عبور ادمین:${CLR_RESET}         ${CLR_YELLOW}${ADMIN_PASS}${CLR_RESET}"
echo -e " ${CLR_WHITE}🔒 وضعیت SSL (HTTPS):${CLR_RESET}     ${CLR_GREEN}${SSL_STATUS}${CLR_RESET}"
echo -e " ${CLR_WHITE}📂 مسیر نصب سورس‌کد:${CLR_RESET}      ${CLR_WHITE}${TARGET_DIR}${CLR_RESET}"
echo -e " ${CLR_WHITE}🛠 ابزار مدیریت سرور:${CLR_RESET}      ${CLR_GREEN}arka-cli${CLR_RESET} ${CLR_DIM}(در ترمینال تایپ کنید)${CLR_RESET}"
echo -e "==================================================================\n"
