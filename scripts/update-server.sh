#!/usr/bin/env bash
# ==============================================================================
# ARKA AI — 1-Click Server Update & Google OAuth Setup
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
ENV_FILE="$TARGET_DIR/.env"

GITHUB_TOKEN="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"

echo -e " ${CLR_CYAN}ℹ [1/4] دریافت جدیدترین نسخه سورس‌کد و رفع هاله صفحه لاگین...${CLR_RESET}"
cd "$TARGET_DIR"
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/AliRezaC-xrol/arka.git"
git fetch origin main
git reset --hard origin/main
echo -e " ${CLR_GREEN}✔ سورس‌کد با موفقیت به آخرین نسخه ارکا به‌روزرسانی شد.${CLR_RESET}"

# 2. Check and prompt for Google OAuth
echo -e "\n ${CLR_CYAN}ℹ [2/4] بررسی تنظیمات ورود با گوگل (Google OAuth)...${CLR_RESET}"

CURRENT_URL=$(grep "^NEXT_PUBLIC_APP_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
if [[ -z "$CURRENT_URL" || "$CURRENT_URL" == *"yourdomain.com"* ]]; then
  SERVER_IP=$(curl -s --max-time 4 https://api.ipify.org || hostname -I | awk '{print $1}')
  CURRENT_URL="http://$SERVER_IP"
fi

REDIRECT_URI="${CURRENT_URL}/api/auth/callback/google"

echo -e " ${CLR_WHITE}🌐 دامنه فعال سامانه:${CLR_RESET} ${CLR_CYAN}${CURRENT_URL}${CLR_RESET}"
echo -e " ${CLR_WHITE}🔗 آدرس مجاز بازگشت (Redirect URI) که باید در کنسول گوگل ثبت باشد:${CLR_RESET}"
echo -e "    ${CLR_BOLD}${CLR_GREEN}${REDIRECT_URI}${CLR_RESET}\n"

CLIENT_ID="$1"
CLIENT_SECRET="$2"

if [[ -z "$CLIENT_ID" ]]; then
  echo -e " ${CLR_YELLOW}جهت فعال‌سازی ورود با گوگل، کلیدهای دریافتی از Google Cloud Console را وارد نمایید:${CLR_RESET}"
  echo -en " ${CLR_WHITE}🔑 لطفاً Google Client ID را پیست کنید (یا Enter برای رد شدن): ${CLR_RESET}"
  read -r CLIENT_ID < /dev/tty 2>/dev/null || read -r CLIENT_ID || true
fi
CLIENT_ID=$(echo "$CLIENT_ID" | tr -d '[:space:]')

if [[ -n "$CLIENT_ID" && -z "$CLIENT_SECRET" ]]; then
  echo -en " ${CLR_WHITE}🔑 لطفاً Google Client Secret را پیست کنید: ${CLR_RESET}"
  read -r CLIENT_SECRET < /dev/tty 2>/dev/null || read -r CLIENT_SECRET || true
  CLIENT_SECRET=$(echo "$CLIENT_SECRET" | tr -d '[:space:]')
fi

if [[ -n "$CLIENT_ID" && -n "$CLIENT_SECRET" ]]; then
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
  echo -e " ${CLR_GREEN}✔ کلیدهای گوگل با موفقیت در .env ثبت شدند.${CLR_RESET}"
else
  echo -e " ${CLR_YELLOW}⚠ کلیدهای جدید وارد نشدند؛ تنظیمات قبلی دست‌نخورده باقی ماندند.${CLR_RESET}"
fi

# 3. Build & Migrate
echo -e "\n ${CLR_CYAN}ℹ [3/4] بیلد بهینه و اعمال تغییرات جدید در دیتابیس...${CLR_RESET}"
npx prisma generate
npx prisma db push
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# 4. Reload PM2
echo -e "\n ${CLR_CYAN}ℹ [4/4] بارگذاری مجدد سرور با PM2 بدون قطعی چت...${CLR_RESET}"
pm2 reload arka || pm2 restart arka
pm2 save

ADMIN_PASS=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "=================================================================="
echo "    🎉 به‌روزرسانی با موفقیت اعمال شد و ورود با گوگل فعال گردید!  "
echo "=================================================================="
echo -e "${CLR_RESET}"
echo -e " ${CLR_WHITE}🌐 آدرس سایت (صفحه لاگین اصلاح‌شده):${CLR_RESET} ${CLR_CYAN}${CURRENT_URL}/login${CLR_RESET}"
echo -e " ${CLR_WHITE}🔐 آدرس پنل مدیریت:${CLR_RESET}                 ${CLR_CYAN}${CURRENT_URL}/c-xroladi1n${CLR_RESET}"
echo -e " ${CLR_WHITE}🔑 رمز عبور ادمین:${CLR_RESET}                   ${CLR_YELLOW}${ADMIN_PASS}${CLR_RESET}"
echo -e "==================================================================\n"
