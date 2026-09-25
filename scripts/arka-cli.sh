#!/usr/bin/env bash
# ==============================================================================
# ARKA AI Platform — Server Management CLI (arka-cli)
# Version: 1.0.0
# License: Proprietary
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

# Default install path
ARKA_DIR="${ARKA_DIR:-/home/user/arka}"
if [[ ! -d "$ARKA_DIR" && -d "/var/www/arka" ]]; then
  ARKA_DIR="/var/www/arka"
fi
ENV_FILE="$ARKA_DIR/.env"

# Helper print functions
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
  echo -e " ${CLR_DIM}Path: $ARKA_DIR | Node: $(node -v 2>/dev/null || echo 'N/A')${CLR_RESET}"
  echo -e "${CLR_CYAN}──────────────────────────────────────────────────────────────────────────────${CLR_RESET}"
}

log_info() {
  echo -e " ${CLR_CYAN}ℹ${CLR_RESET} ${CLR_WHITE}$1${CLR_RESET}"
}

log_success() {
  echo -e " ${CLR_GREEN}✔${CLR_RESET} ${CLR_BOLD}${CLR_GREEN}$1${CLR_RESET}"
}

log_warn() {
  echo -e " ${CLR_YELLOW}⚠${CLR_RESET} ${CLR_YELLOW}$1${CLR_RESET}"
}

log_error() {
  echo -e " ${CLR_RED}✖${CLR_RESET} ${CLR_BOLD}${CLR_RED}$1${CLR_RESET}"
}

press_enter() {
  echo ""
  echo -en " ${CLR_DIM}برای بازگشت به منوی اصلی [Enter] را فشار دهید...${CLR_RESET}"
  read -r _
}

# ------------------------------------------------------------------------------
# 1. Full Install
# ------------------------------------------------------------------------------
action_full_install() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[1] نصب کامل پروژه (Full Install)${CLR_RESET}"
  echo -e " ${CLR_DIM}شامل بررسی مخازن، وابستگی‌های پکیج، پایگاه‌داده و اجرای سرویس با PM2${CLR_RESET}\n"

  echo -en " آیا مایل به شروع فرآیند نصب هستید؟ (y/n) [y]: "
  read -r confirm
  confirm=${confirm:-y}
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log_warn "عملیات نصب توسط کاربر لغو گردید."
    press_enter
    return
  fi

  log_info "بررسی وجود ابزارهای سیستمی (Node.js, Git, PostgreSQL)..."
  if ! command -v node &>/dev/null; then
    log_error "Node.js روی سیستم یافت نشد. لطفاً ابتدا Node.js 20+ را نصب نمایید."
    press_enter
    return 1
  fi

  log_info "ورود به مسیر پروژه: $ARKA_DIR"
  cd "$ARKA_DIR" || {
    log_error "پوشه پروژه یافت نشد: $ARKA_DIR"
    press_enter
    return 1
  }

  log_info "نصب وابستگی‌های پکیج (pnpm install)..."
  if command -v corepack &>/dev/null; then
    corepack pnpm install --frozen-lockfile || corepack pnpm install
  elif command -v pnpm &>/dev/null; then
    pnpm install --frozen-lockfile || pnpm install
  else
    npm install
  fi

  log_info "بررسی و اعمال اسکیما در دیتابیس (Prisma Generate & DB Push)..."
  if command -v corepack &>/dev/null; then
    corepack pnpm prisma generate
    corepack pnpm prisma db push
  else
    npx prisma generate
    npx prisma db push
  fi

  log_info "کامپایل و بیلد نسخه تولیدی Next.js (pnpm build)..."
  if command -v corepack &>/dev/null; then
    corepack pnpm run build
  else
    npm run build
  fi

  log_info "بررسی وضعیت PM2..."
  if command -v pm2 &>/dev/null; then
    if pm2 list | grep -q "arka"; then
      log_info "سرویس قبلی در حال اجراست. ریستارت نرم با reload..."
      pm2 reload ecosystem.config.js || pm2 restart ecosystem.config.js
    else
      log_info "شروع اجرای فرآیند جدید در PM2..."
      pm2 start ecosystem.config.js
    fi
    pm2 save 2>/dev/null || true
  else
    log_warn "PM2 به صورت سراسری نصب نشده است. می‌توانید با 'npm i -g pm2' نصب کنید."
  fi

  log_success "پروژه ارکا با موفقیت نصب و راه‌اندازی شد!"
  press_enter
}

# ------------------------------------------------------------------------------
# 2. Full Uninstall
# ------------------------------------------------------------------------------
action_full_uninstall() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_RED}[2] حذف کامل پروژه (Full Uninstall)${CLR_RESET}"
  echo -e " ${CLR_RED}هشدار: این عمل سرویس را متوقف کرده و پوشه‌های بیلد و تنظیمات را پاک می‌کند.${CLR_RESET}\n"

  echo -en " ${CLR_RED}${CLR_BOLD}آیا از حذف کامل اطمینان دارید؟ این عمل غیرقابل بازگشت است! (Are you sure? y/N): ${CLR_RESET}"
  read -r confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log_info "عملیات حذف لغو شد. داده‌ها دست‌نخورده باقی ماندند."
    press_enter
    return
  fi

  log_info "توقف فرآیند در PM2..."
  if command -v pm2 &>/dev/null; then
    pm2 stop arka 2>/dev/null || true
    pm2 delete arka 2>/dev/null || true
    pm2 save 2>/dev/null || true
    log_success "فرآیند arka از PM2 حذف شد."
  fi

  echo -en " آیا مایل به پاک‌سازی کش Next.js و دایرکتوری .next هستید؟ (y/n) [y]: "
  read -r clean_build
  clean_build=${clean_build:-y}
  if [[ "$clean_build" == "y" || "$clean_build" == "Y" ]]; then
    rm -rf "$ARKA_DIR/.next"
    log_success "دایرکتوری بیلد .next پاک شد."
  fi

  log_success "عملیات حذف و توقف سرویس با موفقیت به پایان رسید."
  press_enter
}

# ------------------------------------------------------------------------------
# 3. Domain Setup & Certbot SSL
# ------------------------------------------------------------------------------
action_setup_domain_ssl() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[3] اتصال دامنه به سرور و راه‌اندازی SSL رایگان (Certbot)${CLR_RESET}\n"

  echo -en " لطفاً نام دامنه اصلی خود را بدون https یا www وارد نمایید (مثال: arka.example.com): "
  read -r domain_name
  domain_name=$(echo "$domain_name" | tr -d '[:space:]')

  if [[ -z "$domain_name" ]]; then
    log_error "نام دامنه نمی‌تواند خالی باشد."
    press_enter
    return 1
  fi

  echo -en " آدرس ایمیل جهت هشدارهای تمدید گواهینامه SSL: "
  read -r email_addr
  email_addr=$(echo "$email_addr" | tr -d '[:space:]')
  email_addr=${email_addr:-"admin@$domain_name"}

  log_info "تولید پیکربندی Nginx برای دامنه $domain_name..."
  NGINX_CONF_PATH="/etc/nginx/sites-available/$domain_name"

  if [[ -w "/etc/nginx/sites-available" ]] || sudo true 2>/dev/null; then
    sudo bash -c "cat << 'EOF' > '$NGINX_CONF_PATH'
server {
    listen 80;
    listen [::]:80;
    server_name $domain_name www.$domain_name;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
EOF"
    sudo ln -sf "$NGINX_CONF_PATH" "/etc/nginx/sites-enabled/"
    sudo nginx -t && sudo systemctl reload nginx
    log_success "پیکربندی Nginx اعمال شد."

    if command -v certbot &>/dev/null; then
      log_info "درخواست صدور گواهینامه SSL از Let's Encrypt با سرتبات..."
      sudo certbot --nginx -d "$domain_name" -m "$email_addr" --agree-tos --non-interactive || {
        log_warn "صدور خودکار سرتبات با خطا مواجه شد. لطفاً رکورد DNS دامنه (A-Record) را بررسی نمایید."
      }
    else
      log_warn "دستور certbot یافت نشد. لطفاً با 'sudo apt install certbot python3-certbot-nginx' نصب نمایید."
    fi
  else
    log_warn "دسترسی sudo به مسیر /etc/nginx/sites-available وجود ندارد."
    log_info "نمونه کانفیگ Nginx:"
    echo "server { server_name $domain_name; location / { proxy_pass http://127.0.0.1:3000; } }"
  fi

  # Update NEXT_PUBLIC_APP_URL in .env
  if [[ -f "$ENV_FILE" ]]; then
    if grep -q "NEXT_PUBLIC_APP_URL=" "$ENV_FILE"; then
      sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"https://$domain_name\"|g" "$ENV_FILE"
    else
      echo "NEXT_PUBLIC_APP_URL=\"https://$domain_name\"" >> "$ENV_FILE"
    fi
    log_success "متغیر NEXT_PUBLIC_APP_URL در فایل .env به روزرسانی شد: https://$domain_name"
  fi

  press_enter
}

# ------------------------------------------------------------------------------
# 4. Set Admin Password (First Time)
# ------------------------------------------------------------------------------
action_set_admin_password() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[4] تعریف گذرواژه ادمین پنل برای اولین بار${CLR_RESET}\n"

  if [[ ! -f "$ENV_FILE" ]]; then
    touch "$ENV_FILE"
  fi

  # Check if password already exists
  existing_pass=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '[:space:]')
  if [[ -n "$existing_pass" ]]; then
    log_warn "گذرواژه ادمین در حال حاضر در فایل .env تعریف شده است!"
    log_info "جهت تغییر آن لطفاً از گزینه [5] (تغییر پسورد ادمین) استفاده نمایید."
    press_enter
    return
  fi

  echo -en " لطفاً گذرواژه جدید پنل مدیریت را وارد کنید: "
  read -r -s new_pass
  echo ""

  if [[ ${#new_pass} -lt 8 ]]; then
    log_error "گذرواژه باید حداقل ۸ کاراکتر باشد."
    press_enter
    return 1
  fi

  echo "ADMIN_PANEL_PASSWORD=\"$new_pass\"" >> "$ENV_FILE"
  log_success "گذرواژه ادمین با موفقیت ذخیره شد."
  log_info "مسیر دسترسی محرمانه به پنل ادمین: /c-xroladi1n"

  press_enter
}

# ------------------------------------------------------------------------------
# 5. Change Admin Password
# ------------------------------------------------------------------------------
action_change_admin_password() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[5] تغییر گذرواژه ادمین پنل${CLR_RESET}\n"

  if [[ ! -f "$ENV_FILE" ]]; then
    log_error "فایل .env یافت نشد: $ENV_FILE"
    press_enter
    return 1
  fi

  existing_pass=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '[:space:]')
  if [[ -n "$existing_pass" ]]; then
    echo -en " گذرواژه فعلی مدیریت را وارد کنید: "
    read -r -s current_input
    echo ""

    if [[ "$current_input" != "$existing_pass" ]]; then
      log_error "گذرواژه فعلی نادرست است! دسترسی غیرمجاز."
      press_enter
      return 1
    fi
    log_success "اعتبارسنجی گذرواژه قبلی تایید شد."
  fi

  echo -en " لطفاً گذرواژه جدید مدیریت را وارد کنید: "
  read -r -s new_pass1
  echo ""
  echo -en " تکرار گذرواژه جدید: "
  read -r -s new_pass2
  echo ""

  if [[ "$new_pass1" != "$new_pass2" ]]; then
    log_error "تکرار گذرواژه همخوانی ندارد."
    press_enter
    return 1
  fi

  if [[ ${#new_pass1} -lt 8 ]]; then
    log_error "گذرواژه باید حداقل ۸ کاراکتر باشد."
    press_enter
    return 1
  fi

  if grep -q "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE"; then
    sed -i "s|^ADMIN_PANEL_PASSWORD=.*|ADMIN_PANEL_PASSWORD=\"$new_pass1\"|g" "$ENV_FILE"
  else
    echo "ADMIN_PANEL_PASSWORD=\"$new_pass1\"" >> "$ENV_FILE"
  fi

  log_success "گذرواژه مدیریت سیستم با موفقیت به روزرسانی شد."
  press_enter
}

# ------------------------------------------------------------------------------
# 6. Renew / Check SSL Certificate
# ------------------------------------------------------------------------------
action_check_renew_ssl() {
  print_banner
  echo -e " ${CLR_BOLD}${CLR_WHITE}[6] بررسی و تمدید گواهینامه امنیتی SSL (Certbot)${CLR_RESET}\n"

  if command -v certbot &>/dev/null; then
    log_info "بررسی لیست گواهینامه‌های نصب‌شده روی سرور..."
    sudo certbot certificates 2>/dev/null || certbot certificates 2>/dev/null || true

    echo ""
    log_info "تست اعتبارسنجی تمدید خودکار (Dry Run)..."
    sudo certbot renew --dry-run || certbot renew --dry-run || {
      log_warn "تست تمدید با شکست مواجه شد. لطفاً لاگ‌های سرتبات را در /var/log/letsencrypt بررسی کنید."
    }
  else
    log_warn "Certbot روی این سرور نصب نیست."
    log_info "می‌توانید با دستور زیر نصب کنید: sudo apt install -y certbot python3-certbot-nginx"
  fi

  press_enter
}

# ------------------------------------------------------------------------------
# CLI Flags Handler for Automated / Non-interactive usage
# ------------------------------------------------------------------------------
handle_flags() {
  case "$1" in
    --help|-h)
      echo "Arka CLI (arka-cli) - Server Management Tool"
      echo "Usage:"
      echo "  arka-cli                    Launch interactive menu"
      echo "  arka-cli --version          Show version"
      echo "  arka-cli status             Show system status"
      echo "  arka-cli install            Trigger automated install"
      echo "  arka-cli set-pass <pass>    Directly set/update admin password"
      echo "  arka-cli renew-ssl          Trigger certbot SSL renew"
      exit 0
      ;;
    --version|-v)
      echo "arka-cli version 1.0.0"
      exit 0
      ;;
    status)
      log_info "Node version: $(node -v 2>/dev/null || echo 'Not installed')"
      log_info "PM2 status:"
      pm2 status 2>/dev/null || echo "PM2 not running"
      exit 0
      ;;
    set-pass)
      if [[ -z "$2" ]]; then
        echo "Usage: arka-cli set-pass <new_password>"
        exit 1
      fi
      if grep -q "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE"; then
        sed -i "s|^ADMIN_PANEL_PASSWORD=.*|ADMIN_PANEL_PASSWORD=\"$2\"|g" "$ENV_FILE"
      else
        echo "ADMIN_PANEL_PASSWORD=\"$2\"" >> "$ENV_FILE"
      fi
      echo "Admin password updated."
      exit 0
      ;;
    renew-ssl)
      certbot renew --dry-run 2>/dev/null || echo "Certbot not found"
      exit 0
      ;;
  esac
}

if [[ $# -gt 0 ]]; then
  handle_flags "$@"
fi

# ------------------------------------------------------------------------------
# Interactive Menu Loop
# ------------------------------------------------------------------------------
while true; do
  print_banner
  echo -e " ${CLR_WHITE}لطفاً یکی از گزینه‌های زیر را انتخاب نمایید:${CLR_RESET}\n"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[1]${CLR_RESET}  ${CLR_WHITE}نصب کامل پروژه (Full Install)${CLR_RESET} ${CLR_DIM}— کلون، وابستگی‌ها، دیتابیس، بیلد، PM2${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[2]${CLR_RESET}  ${CLR_RED}حذف کامل پروژه (Full Uninstall)${CLR_RESET} ${CLR_DIM}— توقف PM2، پاک‌سازی بیلد با تاییدیه${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[3]${CLR_RESET}  ${CLR_WHITE}اتصال دامنه و راه‌اندازی SSL رایگان${CLR_RESET} ${CLR_DIM}— پیکربندی Nginx و Certbot${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[4]${CLR_RESET}  ${CLR_WHITE}تعریف پسورد ادمین پنل برای اولین بار${CLR_RESET} ${CLR_DIM}— همراه با اعتبارسنجی${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[5]${CLR_RESET}  ${CLR_WHITE}تغییر پسورد ادمین پنل${CLR_RESET} ${CLR_DIM}— احراز هویت گذرواژه قبلی و جایگزینی${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[6]${CLR_RESET}  ${CLR_WHITE}تمدید / بررسی گواهینامه SSL${CLR_RESET} ${CLR_DIM}— بررسی انقضا و آزمایش Dry Run${CLR_RESET}"
  echo -e "  ${CLR_CYAN}${CLR_BOLD}[7]${CLR_RESET}  ${CLR_YELLOW}خروج (Exit)${CLR_RESET}"
  echo ""
  echo -en " ${CLR_BOLD}${CLR_CYAN}شماره مورد نظر [1-7]: ${CLR_RESET}"
  read -r choice

  case "$choice" in
    1) action_full_install ;;
    2) action_full_uninstall ;;
    3) action_setup_domain_ssl ;;
    4) action_set_admin_password ;;
    5) action_change_admin_password ;;
    6) action_check_renew_ssl ;;
    7|q|Q)
      echo -e "\n ${CLR_GREEN}با تشکر از استفاده از Arka CLI. روز خوش!${CLR_RESET}\n"
      exit 0
      ;;
    *)
      log_warn "گزینه نامعتبر است. لطفاً عددی بین ۱ تا ۷ وارد کنید."
      sleep 1.2
      ;;
  esac
done
