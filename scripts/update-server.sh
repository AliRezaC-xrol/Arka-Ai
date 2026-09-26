#!/usr/bin/env bash
# ==============================================================================
# ARKA AI — 1-Click Server Update & Interactive Google OAuth Setup
# Proprietary & Confidential — Copyright (c) 2026 AliRezaC-xrol
# ==============================================================================

set -e

CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_GREEN="\033[1;32m"
CLR_CYAN="\033[1;36m"
CLR_YELLOW="\033[1;33m"
CLR_RED="\033[1;31m"
CLR_WHITE="\033[1;37m"

echo -e "${CLR_CYAN}${CLR_BOLD}"
echo "=================================================================="
echo "    ⚡ ARKA AI — به‌روزرسانی هوشمند سورس‌کد و فعال‌سازی گوگل       "
echo "=================================================================="
echo -e "${CLR_RESET}"

TARGET_DIR="/var/www/arka"
if [[ ! -d "$TARGET_DIR" && -d "/home/user/arka" ]]; then
  TARGET_DIR="/home/user/arka"
fi

if [[ ! -d "$TARGET_DIR" ]]; then
  echo -e "${CLR_RED}✖ پوشه ارکا در مسیر /var/www/arka یافت نشد.${CLR_RESET}"
  exit 1
fi

ENV_FILE="$TARGET_DIR/.env"

# NEVER hardcode credentials in the repository. Either export GITHUB_TOKEN
# before running this script, or rely on the server's own git credential store.
REMOTE_URL="https://github.com/AliRezaC-xrol/arka.git"

echo -e " ${CLR_CYAN}ℹ [1/4] دریافت جدیدترین نسخه سورس‌کد...${CLR_RESET}"
cd "$TARGET_DIR"
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/AliRezaC-xrol/arka.git"
else
  git remote set-url origin "$REMOTE_URL"
fi
git fetch origin main
git reset --hard origin/main
# Strip any embedded token back out so it is never left in .git/config.
git remote set-url origin "$REMOTE_URL"
echo -e " ${CLR_GREEN}✔ سورس‌کد با موفقیت به آخرین نسخه ارکا به‌روزرسانی شد.${CLR_RESET}"

# 2. Check and prompt for Google OAuth
echo -e "\n ${CLR_CYAN}ℹ [2/4] پیکربندی اتصال به گوگل (Google OAuth 2.0)...${CLR_RESET}"

CURRENT_URL=$(grep "^NEXT_PUBLIC_APP_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
if [[ -z "$CURRENT_URL" || "$CURRENT_URL" == *"yourdomain.com"* ]]; then
  SERVER_IP=$(curl -s --max-time 4 https://api.ipify.org || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
  CURRENT_URL="http://$SERVER_IP"
fi

REDIRECT_URI="${CURRENT_URL}/api/auth/callback/google"

echo -e " ${CLR_WHITE}🌐 آدرس فعال سامانه شما:${CLR_RESET} ${CLR_CYAN}${CURRENT_URL}${CLR_RESET}"
echo -e " ${CLR_WHITE}🔗 آدرس مجاز بازگشت (Redirect URI) که باید در کنسول گوگل ثبت باشد:${CLR_RESET}"
echo -e "    ${CLR_BOLD}${CLR_GREEN}${REDIRECT_URI}${CLR_RESET}\n"

EXISTING_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")

CLIENT_ID="$1"
CLIENT_SECRET="$2"

if [[ -n "$CLIENT_ID" && -n "$CLIENT_SECRET" ]]; then
  APPLY_GOOGLE=true
else
  echo -e " ${CLR_YELLOW}راهنمای ۱ دقیقه‌ای دریافت کلید از Google Cloud Console:${CLR_RESET}"
  echo -e "  ۱. وارد لینک روبرو شوید: https://console.cloud.google.com/apis/credentials"
  echo -e "  ۲. دکمه Create Credentials را زده و گزینه OAuth client ID (نوع Web application) را انتخاب کنید."
  echo -e "  ۳. در بخش Authorized redirect URIs، دقیقاً آدرس سبز بالا را اضافه نمایید."
  echo -e "  ۴. سپس کلیدهای Client ID و Client Secret دریافتی را در زیر پیست کنید.\n"

  echo -en " ${CLR_BOLD}${CLR_WHITE}آیا می‌خواهید اکنون کلیدهای Google OAuth را وارد یا به‌روز کنید؟ [Y/n]: ${CLR_RESET}"
  read -r DO_SETUP < /dev/tty 2>/dev/null || read -r DO_SETUP || DO_SETUP="y"

  if [[ "$DO_SETUP" =~ ^[Yy]$ || -z "$DO_SETUP" ]]; then
    echo -en " ${CLR_WHITE}🔑 لطفاً Google Client ID را پیست کنید: ${CLR_RESET}"
    read -r CLIENT_ID < /dev/tty 2>/dev/null || read -r CLIENT_ID || true
    CLIENT_ID=$(echo "$CLIENT_ID" | tr -d '[:space:]' | tr -d '"' | tr -d "'")

    echo -en " ${CLR_WHITE}🔑 لطفاً Google Client Secret را پیست کنید: ${CLR_RESET}"
    read -r CLIENT_SECRET < /dev/tty 2>/dev/null || read -r CLIENT_SECRET || true
    CLIENT_SECRET=$(echo "$CLIENT_SECRET" | tr -d '[:space:]' | tr -d '"' | tr -d "'")

    if [[ -n "$CLIENT_ID" && -n "$CLIENT_SECRET" ]]; then
      APPLY_GOOGLE=true
    else
      echo -e " ${CLR_YELLOW}⚠ یکی از کلیدها خالی بود؛ تنظیمات قبلی گوگل حفظ شد.${CLR_RESET}"
      APPLY_GOOGLE=false
    fi
  else
    echo -e " ${CLR_YELLOW}ℹ عبور از تنظیم کلیدهای گوگل.${CLR_RESET}"
    APPLY_GOOGLE=false
  fi
fi

if [[ "$APPLY_GOOGLE" = true ]]; then
  if grep -q "^GOOGLE_CLIENT_ID=" "$ENV_FILE"; then
    sed -i "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=\"${CLIENT_ID}\"|g" "$ENV_FILE"
  else
    echo "GOOGLE_CLIENT_ID=\"${CLIENT_ID}\"" >> "$ENV_FILE"
  fi

  if grep -q "^GOOGLE_CLIENT_SECRET=" "$ENV_FILE"; then
    sed -i "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=\"${CLIENT_SECRET}\"|g" "$ENV_FILE"
  else
    echo "GOOGLE_CLIENT_SECRET=\"${CLIENT_SECRET}\"" >> "$ENV_FILE"
  fi
  echo -e " ${CLR_GREEN}✔ کلیدهای گوگل با موفقیت در .env ذخیره شدند.${CLR_RESET}"
fi

# 2.5 Ensure Admin Password synchronization between ADMIN_PASSWORD and ADMIN_PANEL_PASSWORD
EXISTING_PASS=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
if [[ -z "$EXISTING_PASS" ]]; then
  EXISTING_PASS=$(grep "^ADMIN_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
fi

if [[ -z "$EXISTING_PASS" ]]; then
  EXISTING_PASS="Arka-$(openssl rand -hex 4 2>/dev/null | tr '[:lower:]' '[:upper:]' || echo '2026Master')"
fi

echo -e "\n ${CLR_CYAN}ℹ بررسی رمز عبور پنل مدیریت:${CLR_RESET}"
echo -e " ${CLR_WHITE}🔑 رمز عبور فعلی ثبت‌شده:${CLR_RESET} ${CLR_YELLOW}${EXISTING_PASS}${CLR_RESET}"
echo -en " ${CLR_WHITE}آیا می‌خواهید رمز عبور پنل مدیریت را تغییر دهید؟ [y/N]: ${CLR_RESET}"
read -r CHANGE_PASS < /dev/tty 2>/dev/null || read -r CHANGE_PASS || CHANGE_PASS="n"

if [[ "$CHANGE_PASS" =~ ^[Yy]$ ]]; then
  echo -en " ${CLR_BOLD}${CLR_WHITE}🔑 لطفاً رمز عبور دلخواه جدید را وارد کنید: ${CLR_RESET}"
  read -r NEW_PASS < /dev/tty 2>/dev/null || read -r NEW_PASS || true
  NEW_PASS=$(echo "$NEW_PASS" | tr -d '[:space:]' | tr -d '"' | tr -d "'")
  if [[ -n "$NEW_PASS" ]]; then
    EXISTING_PASS="$NEW_PASS"
    echo -e " ${CLR_GREEN}✔ رمز عبور به $EXISTING_PASS تغییر یافت.${CLR_RESET}"
  fi
fi

if grep -q "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE"; then
  sed -i "s|^ADMIN_PANEL_PASSWORD=.*|ADMIN_PANEL_PASSWORD=\"${EXISTING_PASS}\"|g" "$ENV_FILE"
else
  echo "ADMIN_PANEL_PASSWORD=\"${EXISTING_PASS}\"" >> "$ENV_FILE"
fi

if grep -q "^ADMIN_PASSWORD=" "$ENV_FILE"; then
  sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=\"${EXISTING_PASS}\"|g" "$ENV_FILE"
else
  echo "ADMIN_PASSWORD=\"${EXISTING_PASS}\"" >> "$ENV_FILE"
fi

# 3. Build & Migrate
echo -e "\n ${CLR_CYAN}ℹ [3/4] بیلد بهینه و اعمال تغییرات جدید در دیتابیس...${CLR_RESET}"
npx prisma generate
npx prisma db push
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# 4. Reload PM2
echo -e "\n ${CLR_CYAN}ℹ [4/4] بارگذاری مجدد سرور با PM2 بدون قطعی...${CLR_RESET}"
if command -v pm2 &>/dev/null; then
  pm2 reload arka || pm2 restart arka
  pm2 save
fi

ADMIN_PASS=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "=================================================================="
echo "    🎉 به‌روزرسانی با موفقیت اعمال شد و ورود با گوگل فعال گردید!  "
echo "=================================================================="
echo -e "${CLR_RESET}"
echo -e " ${CLR_WHITE}🌐 آدرس صفحه لاگین (اصلاح شده):${CLR_RESET}   ${CLR_CYAN}${CURRENT_URL}/login${CLR_RESET}"
echo -e " ${CLR_WHITE}🔐 آدرس پنل مدیریت:${CLR_RESET}               ${CLR_CYAN}${CURRENT_URL}/c-xroladi1n${CLR_RESET}"
echo -e " ${CLR_WHITE}🔑 رمز عبور ادمین:${CLR_RESET}                 ${CLR_YELLOW}${ADMIN_PASS}${CLR_RESET}"
echo -e "==================================================================\n"
