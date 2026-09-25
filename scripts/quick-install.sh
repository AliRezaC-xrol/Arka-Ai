#!/usr/bin/env bash
# ==============================================================================
# ARKA AI Platform — 1-Click Automated Server Installer (Bulletproof All-In-One)
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
echo "    ⚡ ARKA AI PLATFORM — نصب خودکار و هوشمند سرور (1-Click)     "
echo "=================================================================="
echo -e "${CLR_RESET}"

# Check root
if [[ $EUID -ne 0 ]]; then
   echo -e "${CLR_RED}✖ لطفاً این اسکریپت را با دسترسی روت (sudo) اجرا کنید.${CLR_RESET}"
   exit 1
fi

GITHUB_TOKEN="${1:-${TOKEN:-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}}"
DOMAIN_NAME="${2:-${DOMAIN:-}}"
TARGET_DIR="/var/www/arka"

# 1. Detect Server Public IP
echo -e " ${CLR_CYAN}ℹ [1/8] شناسایی IP عمومی سرور...${CLR_RESET}"
SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')
echo -e " ${CLR_GREEN}✔ IP عمومی سرور: ${CLR_WHITE}$SERVER_IP${CLR_RESET}"

# Check and Add Swap if RAM is low (prevents Next.js build crash on 1GB/2GB VPS)
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
SWAP_EXISTS=$(free -m | awk '/^Swap:/{print $2}')
if [[ $SWAP_EXISTS -lt 1024 && $TOTAL_RAM_MB -lt 3000 ]]; then
  echo -e " ${CLR_YELLOW}⚠ رم سرور ${TOTAL_RAM_MB}MB است. ایجاد خودکار ۲ گیگابایت Swap برای جلوگیری از توقف بیلد...${CLR_RESET}"
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile 2>/dev/null || true
  swapon /swapfile 2>/dev/null || true
  echo '/swapfile none swap sw 0 0' >> /etc/fstab 2>/dev/null || true
  echo -e " ${CLR_GREEN}✔ Swap با موفقیت فعال شد.${CLR_RESET}"
fi

# 2. Update System & Install Base Packages
echo -e "\n ${CLR_CYAN}ℹ [2/8] به‌روزرسانی مخازن و نصب پکیج‌های پایه...${CLR_RESET}"
apt-get update -y || true
apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib openssl

# 3. Install Node.js 20 LTS & PM2
echo -e "\n ${CLR_CYAN}ℹ [3/8] بررسی و نصب Node.js 20 LTS و PM2...${CLR_RESET}"
if ! command -v node &>/dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo -e " ${CLR_GREEN}✔ Node.js: $(node -v) | npm: $(npm -v)${CLR_RESET}"

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

# 4. Setup PostgreSQL Database
echo -e "\n ${CLR_CYAN}ℹ [4/8] راه‌اندازی و بهینه‌سازی پایگاه‌داده PostgreSQL...${CLR_RESET}"
systemctl start postgresql 2>/dev/null || service postgresql start || true
systemctl enable postgresql 2>/dev/null || true

DB_USER="arka"
DB_PASS="arka_$(openssl rand -hex 12)"
DB_NAME="arka"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' SUPERUSER;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true

# 5. Clone or Update Arka Source Code
echo -e "\n ${CLR_CYAN}ℹ [5/8] دریافت سورس‌کد پروژه از گیت‌هاب...${CLR_RESET}"
mkdir -p "$TARGET_DIR"

if [[ -d "$TARGET_DIR/.git" ]]; then
  echo -e " بروزرسانی سورس‌کد موجود در $TARGET_DIR..."
  cd "$TARGET_DIR"
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/AliRezaC-xrol/arka.git"
  git pull origin main || true
else
  echo -e " کلون تمیز پروژه به $TARGET_DIR..."
  git clone "https://${GITHUB_TOKEN}@github.com/AliRezaC-xrol/arka.git" "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

# 6. Generate Cryptographic Keys & .env
echo -e "\n ${CLR_CYAN}ℹ [6/8] ایجاد کلیدهای رمزنگاری نظامی AES-256 و متغیرهای محیطی...${CLR_RESET}"
SESSION_SECRET=$(openssl rand -hex 32)
BYOK_ENCRYPTION_KEY=$(openssl rand -hex 32)
ADMIN_PASS="Arka_$(openssl rand -hex 6)"

APP_URL="http://$SERVER_IP"
if [[ -n "$DOMAIN_NAME" ]]; then
  APP_URL="https://$DOMAIN_NAME"
fi

# Only create new .env if not already configured with password
if [[ ! -f "$TARGET_DIR/.env" ]] || ! grep -q "ADMIN_PANEL_PASSWORD" "$TARGET_DIR/.env"; then
cat << ENVEOF > "$TARGET_DIR/.env"
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
NEXT_PUBLIC_APP_URL="${APP_URL}"
SESSION_SECRET="${SESSION_SECRET}"
BYOK_ENCRYPTION_KEY="${BYOK_ENCRYPTION_KEY}"
ADMIN_PANEL_PASSWORD="${ADMIN_PASS}"
# Google OAuth (Can be added later in .env)
GOOGLE_CLIENT_ID="placeholder.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="placeholder-secret"
ENVEOF
else
  ADMIN_PASS=$(grep "ADMIN_PANEL_PASSWORD=" "$TARGET_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  APP_URL=$(grep "NEXT_PUBLIC_APP_URL=" "$TARGET_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [[ -z "$APP_URL" ]]; then APP_URL="http://$SERVER_IP"; fi
fi

# 7. Install Dependencies, Migrate Prisma & Build Next.js
echo -e "\n ${CLR_CYAN}ℹ [7/8] نصب پکیج‌ها، اعمال جداول دیتابیس و کامپایل بیلد Next.js...${CLR_RESET}"
cd "$TARGET_DIR"
npm ci || npm install --no-audit
npx prisma generate
npx prisma db push

echo -e " کامپایل پروداکشن Next.js..."
npm run build || {
  echo -e " ${CLR_YELLOW}تلاش مجدد برای بیلد با تخصیص حافظه بیشتر...${CLR_RESET}"
  NODE_OPTIONS="--max-old-space-size=2048" npm run build
}

# Start or Reload PM2
pm2 delete arka 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save 2>/dev/null || true
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 8. Configure Nginx Reverse Proxy
echo -e "\n ${CLR_CYAN}ℹ [8/8] پیکربندی وب‌سرور Nginx برای استریم بدون بافر...${CLR_RESET}"
NGINX_HOST="$SERVER_IP"
if [[ -n "$DOMAIN_NAME" ]]; then
  NGINX_HOST="$DOMAIN_NAME www.$DOMAIN_NAME"
fi

cat << NGINXEOF > /etc/nginx/sites-available/arka
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${NGINX_HOST} _;

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

# Setup CLI command
chmod +x "$TARGET_DIR/scripts/arka-cli.sh"
ln -sf "$TARGET_DIR/scripts/arka-cli.sh" /usr/local/bin/arka-cli

# SSL if domain provided
if [[ -n "$DOMAIN_NAME" ]]; then
  echo -e " ${CLR_CYAN}ℹ دریافت گواهینامه SSL برای دامنه $DOMAIN_NAME...${CLR_RESET}"
  certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "admin@$DOMAIN_NAME" 2>/dev/null || {
    echo -e " ${CLR_YELLOW}⚠ دریافت خودکار SSL انجام نشد. بعداً با دستور 'arka-cli' اجرا کنید.${CLR_RESET}"
  }
fi

# Extract final info directly from /var/www/arka/.env to be 100% accurate
FINAL_PASS=$(grep "^ADMIN_PANEL_PASSWORD=" "$TARGET_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
FINAL_URL=$(grep "^NEXT_PUBLIC_APP_URL=" "$TARGET_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [[ -z "$FINAL_URL" ]]; then FINAL_URL="http://$SERVER_IP"; fi

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "=================================================================="
echo "    🎉 تبریک! سامانه هوش مصنوعی ارکا با موفقیت راه‌اندازی شد     "
echo "=================================================================="
echo -e "${CLR_RESET}"
echo -e " ${CLR_WHITE}🌐 آدرس ورود به سامانه:${CLR_RESET}   ${CLR_CYAN}${FINAL_URL}${CLR_RESET}"
echo -e " ${CLR_WHITE}🔐 آدرس پنل مدیریت:${CLR_RESET}       ${CLR_CYAN}${FINAL_URL}/c-xroladi1n${CLR_RESET}"
echo -e " ${CLR_WHITE}🔑 رمز عبور ادمین:${CLR_RESET}         ${CLR_YELLOW}${FINAL_PASS}${CLR_RESET}"
echo -e " ${CLR_WHITE}📂 مسیر نصب پروژه:${CLR_RESET}         ${CLR_WHITE}/var/www/arka${CLR_RESET}"
echo -e " ${CLR_WHITE}🛠 ابزار مدیریت سرور:${CLR_RESET}      ${CLR_GREEN}arka-cli${CLR_RESET} ${CLR_DIM}(در ترمینال تایپ کنید)${CLR_RESET}"
echo -e "==================================================================\n"
