#!/usr/bin/env bash
# ==============================================================================
# ARKA AI — 1-Click Google OAuth Configurator & Live Updater
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
echo "    🔐 ARKA AI — تنظیم خودکار ورود با گوگل (Google OAuth 2.0)    "
echo "=================================================================="
echo -e "${CLR_RESET}"

TARGET_DIR="/var/www/arka"
if [[ ! -d "$TARGET_DIR" && -d "/home/user/arka" ]]; then
  TARGET_DIR="/home/user/arka"
fi
ENV_FILE="$TARGET_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${CLR_RED}✖ فایل تنظیمات $ENV_FILE یافت نشد.${CLR_RESET}"
  exit 1
fi

# Detect domain
CURRENT_URL=$(grep "^NEXT_PUBLIC_APP_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [[ -z "$CURRENT_URL" ]]; then
  SERVER_IP=$(curl -s --max-time 4 https://api.ipify.org || hostname -I | awk '{print $1}')
  CURRENT_URL="http://$SERVER_IP"
fi

REDIRECT_URI="${CURRENT_URL}/api/auth/callback/google"

echo -e " ${CLR_WHITE}🌐 آدرس فعلی سامانه شما:${CLR_RESET} ${CLR_CYAN}${CURRENT_URL}${CLR_RESET}"
echo -e " ${CLR_WHITE}🔗 آدرس مجاز بازگشت (Redirect URI) برای ثبت در کنسول گوگل:${CLR_RESET}"
echo -e "    ${CLR_BOLD}${CLR_GREEN}${REDIRECT_URI}${CLR_RESET}\n"

echo -e " ${CLR_YELLOW}راهنمای ۱ دقیقه‌ای دریافت کلیدها از Google Cloud Console:${CLR_RESET}"
echo -e "  ۱. به لینک https://console.cloud.google.com/apis/credentials بروید."
echo -e "  ۲. روی Create Credentials > OAuth client ID بزنید (نوع: Web application)."
echo -e "  ۳. در بخش Authorized redirect URIs آدرس سبز بالا را پیست کنید."
echo -e "  ۴. کلید Client ID و Client Secret را کپی کرده و در زیر وارد نمایید:\n"

CLIENT_ID="$1"
CLIENT_SECRET="$2"

if [[ -z "$CLIENT_ID" ]]; then
  echo -en " ${CLR_BOLD}${CLR_WHITE}🔑 لطفاً Google Client ID را پیست کنید: ${CLR_RESET}"
  read -r CLIENT_ID < /dev/tty || read -r CLIENT_ID
fi
CLIENT_ID=$(echo "$CLIENT_ID" | tr -d '[:space:]')

if [[ -z "$CLIENT_SECRET" ]]; then
  echo -en " ${CLR_BOLD}${CLR_WHITE}🔑 لطفاً Google Client Secret را پیست کنید: ${CLR_RESET}"
  read -r CLIENT_SECRET < /dev/tty || read -r CLIENT_SECRET
fi
CLIENT_SECRET=$(echo "$CLIENT_SECRET" | tr -d '[:space:]')

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo -e "\n${CLR_RED}✖ خطا: Client ID یا Client Secret نمی‌تواند خالی باشد.${CLR_RESET}"
  exit 1
fi

echo -e "\n ${CLR_CYAN}ℹ در حال ثبت کلیدها در فایل .env...${CLR_RESET}"

# Update GOOGLE_CLIENT_ID
if grep -q "^GOOGLE_CLIENT_ID=" "$ENV_FILE"; then
  sed -i "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=\"${CLIENT_ID}\"|g" "$ENV_FILE"
else
  echo "GOOGLE_CLIENT_ID=\"${CLIENT_ID}\"" >> "$ENV_FILE"
fi

# Update GOOGLE_CLIENT_SECRET
if grep -q "^GOOGLE_CLIENT_SECRET=" "$ENV_FILE"; then
  sed -i "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=\"${CLIENT_SECRET}\"|g" "$ENV_FILE"
else
  echo "GOOGLE_CLIENT_SECRET=\"${CLIENT_SECRET}\"" >> "$ENV_FILE"
fi

echo -e " ${CLR_GREEN}✔ کلیدهای گوگل با موفقیت در .env ذخیره شدند.${CLR_RESET}"

# Reload PM2
echo -e " ${CLR_CYAN}ℹ بارگذاری مجدد سرور با PM2...${CLR_RESET}"
if command -v pm2 &>/dev/null; then
  pm2 reload arka 2>/dev/null || pm2 restart arka 2>/dev/null || true
  pm2 save 2>/dev/null || true
  echo -e " ${CLR_GREEN}✔ سرویس با موفقیت ری‌لود شد.${CLR_RESET}"
fi

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "=================================================================="
echo "    🎉 ورود با گوگل با موفقیت فعال شد!                           "
echo "=================================================================="
echo -e "${CLR_RESET}"
echo -e " ${CLR_WHITE}🌐 اکنون دکمه 'ورود با حساب گوگل' در آدرس زیر بدون خطا کار می‌کند:${CLR_RESET}"
echo -e "    ${CLR_CYAN}${CURRENT_URL}/login${CLR_RESET}"
echo -e "==================================================================\n"
