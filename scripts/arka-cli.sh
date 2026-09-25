#!/usr/bin/env bash
# ==============================================================================
# ARKA AI Platform — Server Management CLI (arka-cli)
# Version: 1.2.0
# License: Proprietary & Closed Source — Copyright (c) 2026 AliRezaC-xrol
# ==============================================================================

set -o pipefail

# ANSI Color Codes
CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_DIM="\033[2m"
CLR_RED="\033[1;31m"
CLR_GREEN="\033[1;32m"
CLR_YELLOW="\033[1;33m"
CLR_BLUE="\033[1;34m"
CLR_PURPLE="\033[1;35m"
CLR_CYAN="\033[1;36m"
CLR_WHITE="\033[1;37m"

ARKA_DIR="/var/www/arka"
if [[ ! -d "$ARKA_DIR" && -d "/home/user/arka" ]]; then
  ARKA_DIR="/home/user/arka"
fi
ENV_FILE="$ARKA_DIR/.env"

print_banner() {
  clear 2>/dev/null || true
  echo -e "${CLR_CYAN}${CLR_BOLD}"
  echo "  █████╗ ██████╗ ██╗  ██╗ █████╗        ██████╗██╗     ██╗"
  echo " ██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗      ██╔════╝██║     ██║"
  echo " ███████║██████╔╝█████╔╝ ███████║█████╗██║     ██║     ██║"
  echo " ██╔══██║██╔══██╗██╔═██╗ ██╔══██║╚════╝██║     ██║     ██║"
  echo " ██║  ██║██║  ██║██║  ██╗██║  ██║      ╚██████╗███████╗██║"
  echo " ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝       ╚═════╝╚══════╝╚═╝"
  echo -e "${CLR_RESET}"
  echo -e " ${CLR_WHITE}${CLR_BOLD}سامانه هوشمند ارکا — ابزار جامع مدیریت سرور و زیرساخت${CLR_RESET}"
  echo -e " ${CLR_DIM}مسیر: $ARKA_DIR | نود: $(node -v 2>/dev/null || echo 'N/A')${CLR_RESET}"
  echo -e "${CLR_CYAN}──────────────────────────────────────────────────────────────────────────────${CLR_RESET}"
}

log_info() { echo -e " ${CLR_CYAN}ℹ${CLR_RESET} ${CLR_WHITE}$1${CLR_RESET}"; }
log_success() { echo -e " ${CLR_GREEN}✔${CLR_RESET} ${CLR_BOLD}${CLR_GREEN}$1${CLR_RESET}"; }
log_warn() { echo -e " ${CLR_YELLOW}⚠${CLR_RESET} ${CLR_YELLOW}$1${CLR_RESET}"; }
log_error() { echo -e " ${CLR_RED}✖${CLR_RESET} ${CLR_BOLD}${CLR_RED}$1${CLR_RESET}"; }

press_enter() {
  echo ""
  echo -en " ${CLR_DIM}برای بازگشت به منوی اصلی [Enter] را فشار دهید...${CLR_RESET}"
  read -r _
}

# 1. Update from GitHub
action_update_arka() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[1] به‌روزرسانی پروژه از گیت‌هاب (Update & Build)${CLR_RESET}\n"
  bash "$ARKA_DIR/scripts/update-server.sh"
  press_enter
}

# 2. Setup Google OAuth
action_setup_google() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[2] تنظیم کلیدهای ورود با گوگل (Google OAuth 2.0)${CLR_RESET}\n"
  bash "$ARKA_DIR/scripts/setup-google-oauth.sh"
  press_enter
}

# 3. Setup Domain & SSL
action_setup_domain() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[3] اتصال دامنه اختصاصی و دریافت رایگان SSL${CLR_RESET}\n"
  bash "$ARKA_DIR/scripts/setup-domain.sh"
  press_enter
}

# 4. Change Admin Password
action_change_admin_password() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[4] تغییر گذرواژه پنل مدیریت (/c-xroladi1n)${CLR_RESET}\n"

  if [[ ! -f "$ENV_FILE" ]]; then
    log_error "فایل .env یافت نشد: $ENV_FILE"
    press_enter
    return 1
  fi

  echo -en " لطفاً گذرواژه جدید مدیریت را وارد کنید: "
  read -r new_pass1
  echo -en " تکرار گذرواژه جدید: "
  read -r new_pass2

  if [[ "$new_pass1" != "$new_pass2" ]]; then
    log_error "تکرار گذرواژه همخوانی ندارد."
    press_enter
    return 1
  fi

  if [[ ${#new_pass1} -lt 6 ]]; then
    log_error "گذرواژه باید حداقل ۶ کاراکتر باشد."
    press_enter
    return 1
  fi

  if grep -q "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE"; then
    sed -i "s|^ADMIN_PANEL_PASSWORD=.*|ADMIN_PANEL_PASSWORD=\"$new_pass1\"|g" "$ENV_FILE"
  else
    echo "ADMIN_PANEL_PASSWORD=\"$new_pass1\"" >> "$ENV_FILE"
  fi

  log_success "گذرواژه پنل مدیریت با موفقیت به‌روزرسانی شد: $new_pass1"
  press_enter
}

# 5. Service Status & Logs
action_status_logs() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[5] وضعیت سرویس‌ها و آخرین لاگ‌های PM2${CLR_RESET}\n"
  pm2 status
  echo -e "\n${CLR_CYAN}آخرین ۲۰ خط لاگ:${CLR_RESET}"
  pm2 logs arka --lines 20 --nostream 2>/dev/null || true
  press_enter
}

# 6. Restart Server
action_restart_server() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[6] راه‌اندازی مجدد بدون قطعی (PM2 Reload)${CLR_RESET}\n"
  pm2 reload arka || pm2 restart arka
  log_success "سرویس ارکا با موفقیت ری‌لود شد."
  press_enter
}

while true; do
  print_banner
  echo -e " ${CLR_WHITE}لطفاً یکی از گزینه‌های زیر را انتخاب نمایید:${CLR_RESET}\n"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[1]${CLR_RESET}  ${CLR_WHITE}به‌روزرسانی پروژه از گیت‌هاب${CLR_RESET} ${CLR_DIM}— پول آخرین کدها، بیلد، رفع هاله لاگین${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[2]${CLR_RESET}  ${CLR_GREEN}تنظیم کلیدهای ورود با گوگل${CLR_RESET} ${CLR_DIM}— رفع خطای ۴۰۱ و ست کردن Client ID/Secret${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[3]${CLR_RESET}  ${CLR_WHITE}اتصال دامنه و دریافت رایگان SSL${CLR_RESET} ${CLR_DIM}— تنظیم Nginx و Certbot${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[4]${CLR_RESET}  ${CLR_WHITE}تغییر گذرواژه پنل مدیریت${CLR_RESET} ${CLR_DIM}— مسیر /c-xroladi1n${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[5]${CLR_RESET}  ${CLR_WHITE}وضعیت سرویس‌ها و لاگ‌ها${CLR_RESET} ${CLR_DIM}— مانیتورینگ PM2 و دیتابیس${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[6]${CLR_RESET}  ${CLR_WHITE}راه‌اندازی مجدد سرویس (Reload)${CLR_RESET} ${CLR_DIM}— بدون قطعی کاربران${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[7]${CLR_RESET}  ${CLR_YELLOW}خروج (Exit)${CLR_RESET}"
  echo ""
  echo -en " ${CLR_BOLD}${CLR_CYAN}شماره مورد نظر [1-7]: ${CLR_RESET}"
  read -r choice

  case "$choice" in
    1) action_update_arka ;;
    2) action_setup_google ;;
    3) action_setup_domain ;;
    4) action_change_admin_password ;;
    5) action_status_logs ;;
    6) action_restart_server ;;
    7|q|Q)
      echo -e "\n ${CLR_GREEN}با تشکر از استفاده از Arka CLI. روز خوش!${CLR_RESET}\n"
      exit 0
      ;;
    *)
      log_warn "گزینه نامعتبر است."
      sleep 1
      ;;
  esac
done
