#!/usr/bin/env bash
# ==============================================================================
# ARKA AI — 1-Click Domain & Auto-SSL Certbot Setup
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
echo "    🌐 ARKA AI — اتصال خودکار دامنه و دریافت رایگان SSL (Certbot)  "
echo "=================================================================="
echo -e "${CLR_RESET}"

DOMAIN="$1"
if [[ -z "$DOMAIN" ]]; then
  echo -en " ${CLR_WHITE}لطفاً نام دامنه خود را بدون https یا www وارد نمایید (مثال: mydomain.com): ${CLR_RESET}"
  read -r DOMAIN
fi

DOMAIN=$(echo "$DOMAIN" | tr -d '[:space:]' | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')

if [[ -z "$DOMAIN" ]]; then
  echo -e " ${CLR_RED}✖ نام دامنه نمی‌تواند خالی باشد.${CLR_RESET}"
  exit 1
fi

echo -e " ${CLR_CYAN}ℹ در حال اتصال دامنه ${CLR_BOLD}${CLR_WHITE}$DOMAIN${CLR_RESET} ${CLR_CYAN}به سرور ارکا...${CLR_RESET}"

TARGET_DIR="/var/www/arka"
if [[ ! -d "$TARGET_DIR" && -d "/home/user/arka" ]]; then
  TARGET_DIR="/home/user/arka"
fi
ENV_FILE="$TARGET_DIR/.env"

# 1. Configure Nginx
echo -e " ${CLR_CYAN}ℹ [1/4] تنظیم وب‌سرور Nginx برای $DOMAIN...${CLR_RESET}"
cat << NGINXEOF > /etc/nginx/sites-available/arka
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

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
nginx -t
systemctl reload nginx 2>/dev/null || service nginx reload || true
echo -e " ${CLR_GREEN}✔ وب‌سرور Nginx با موفقیت روی دامنه $DOMAIN تنظیم شد.${CLR_RESET}"

# 2. Get Free SSL with Certbot
echo -e "\n ${CLR_CYAN}ℹ [2/4] درخواست صدور خودکار گواهینامه امنیتی SSL از Let's Encrypt...${CLR_RESET}"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect -m "admin@$DOMAIN" || {
  echo -e " ${CLR_YELLOW}⚠ دریافت خودکار SSL با خطا مواجه شد. لطفاً مطمئن شوید رکورد A دامنه شما به IP سرور متصل شده باشد.${CLR_RESET}"
}

# 3. Update .env with new domain
echo -e "\n ${CLR_CYAN}ℹ [3/4] به‌روزرسانی متغیر NEXT_PUBLIC_APP_URL در فایل .env...${CLR_RESET}"
if [[ -f "$ENV_FILE" ]]; then
  if grep -q "^NEXT_PUBLIC_APP_URL=" "$ENV_FILE"; then
    sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"https://${DOMAIN}\"|g" "$ENV_FILE"
  else
    echo "NEXT_PUBLIC_APP_URL=\"https://${DOMAIN}\"" >> "$ENV_FILE"
  fi
  echo -e " ${CLR_GREEN}✔ مقدار NEXT_PUBLIC_APP_URL به https://${DOMAIN} تغییر یافت.${CLR_RESET}"
fi

# 4. Reload PM2
echo -e "\n ${CLR_CYAN}ℹ [4/4] بارگذاری مجدد سرویس‌ها با PM2...${CLR_RESET}"
if command -v pm2 &>/dev/null; then
  pm2 reload arka 2>/dev/null || pm2 restart arka 2>/dev/null || true
  pm2 save 2>/dev/null || true
fi

FINAL_PASS=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "رمز قبلی")

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "=================================================================="
echo "    🎉 دامنه و گواهینامه SSL با موفقیت فعال شدند!                "
echo "=================================================================="
echo -e "${CLR_RESET}"
echo -e " ${CLR_WHITE}🌐 آدرس سایت با HTTPS:${CLR_RESET}   ${CLR_CYAN}https://${DOMAIN}${CLR_RESET}"
echo -e " ${CLR_WHITE}🔐 آدرس پنل مدیریت:${CLR_RESET}      ${CLR_CYAN}https://${DOMAIN}/c-xroladi1n${CLR_RESET}"
echo -e " ${CLR_WHITE}🔑 رمز عبور ادمین:${CLR_RESET}        ${CLR_YELLOW}${FINAL_PASS}${CLR_RESET}"
echo -e "==================================================================\n"
