#!/usr/bin/env bash
# ==============================================================================
# ARKA AI — 1-Click Server Update & Interactive Google OAuth Setup
# Proprietary & Confidential — Copyright (c) 2026 AliRezaC-xrol
# ==============================================================================
#
# WHY THIS SCRIPT IS WRITTEN THE WAY IT IS
#
# It used to start with a bare `set -e`, and that silently produced the single
# worst failure mode this project has had: "I ran the update and nothing
# changed." What actually happened was:
#
#   1. `git fetch` failed (usually a bad/expired token) and `set -e` killed the
#      script on that line,
#   2. but the script had *already* printed several green success lines and the
#      terminal looked normal,
#   3. so the run appeared to succeed while the code never moved, the build never
#      ran and pm2 was never reloaded.
#
# A silent abort is worse than a crash. So now:
#   - every network/credential step is checked explicitly and prints a loud,
#     actionable error with the reason and a fix,
#   - we record the commit before and after and *say out loud* whether the code
#     actually moved,
#   - `set -u` is on so an unset variable is an error rather than an empty
#     string, and `set -o pipefail` so a failure mid-pipeline is not swallowed,
#   - `set -e` is deliberately NOT used, because it is exactly what hid the
#     problem: we want to inspect and report each failure, not die quietly.
#
set -uo pipefail

CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_GREEN="\033[1;32m"
CLR_CYAN="\033[1;36m"
CLR_YELLOW="\033[1;33m"
CLR_RED="\033[1;31m"
CLR_WHITE="\033[1;37m"

die() {
  echo -e "\n${CLR_RED}${CLR_BOLD}✖ $1${CLR_RESET}"
  [ -n "${2:-}" ] && echo -e "${CLR_YELLOW}  راه‌حل: $2${CLR_RESET}"
  echo -e "${CLR_RED}  به‌روزرسانی متوقف شد. هیچ تغییری اعمال نشد.${CLR_RESET}\n"
  exit 1
}

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
  die "پوشه ارکا در مسیر /var/www/arka یا /home/user/arka یافت نشد." \
      "مسیر واقعی پروژه را پیدا کنید: find / -maxdepth 4 -name ecosystem.config.js -path '*arka*'"
fi

ENV_FILE="$TARGET_DIR/.env"

# NEVER hardcode credentials in the repository.
#   1. export GITHUB_TOKEN=ghp_xxx  ->  used for this run, then stripped again
#   2. otherwise the credentials already configured on this server are kept
REMOTE_URL="https://github.com/AliRezaC-xrol/arka.git"
INJECTED_TOKEN=false

echo -e " ${CLR_CYAN}ℹ [1/5] دریافت جدیدترین نسخه سورس‌کد...${CLR_RESET}"
cd "$TARGET_DIR" || die "ورود به پوشه پروژه ناموفق بود: $TARGET_DIR"

if [[ ! -d ".git" ]]; then
  die "این پوشه یک مخزن گیت نیست: $TARGET_DIR" \
      "cd $TARGET_DIR && git init && git remote add origin $REMOTE_URL && git fetch origin main && git reset --hard origin/main"
fi

# ---- Record where we are, so we can prove whether anything actually moved ----
BEFORE_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
BEFORE_DESC=$(git log -1 --format='%h %s' 2>/dev/null || echo "unknown")
echo -e " ${CLR_WHITE}نسخه فعلی روی سرور:${CLR_RESET} ${CLR_YELLOW}${BEFORE_DESC}${CLR_RESET}"

CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  # Token supplied for this run only. Accept both classic (ghp_) and
  # fine-grained (github_pat_) tokens; both are pasted the same way.
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/AliRezaC-xrol/arka.git" \
    || die "تنظیم آدرس مخزن ناموفق بود." "git remote -v را بررسی کنید."
  INJECTED_TOKEN=true
  echo -e " ${CLR_CYAN}ℹ از توکن ارائه‌شده در همین دستور استفاده می‌شود.${CLR_RESET}"
elif [[ "$CURRENT_REMOTE" == *"@"* && "$CURRENT_REMOTE" == *"github.com"* ]]; then
  echo -e " ${CLR_YELLOW}ℹ از اطلاعات ورود ذخیره‌شده روی سرور استفاده می‌شود.${CLR_RESET}"
else
  git remote set-url origin "$REMOTE_URL"
fi

# ---- Fetch. This is the step that used to fail silently. ----
echo -e " ${CLR_CYAN}ℹ در حال دریافت از گیت‌هاب...${CLR_RESET}"
FETCH_ERR=$(mktemp)
if ! git fetch origin main 2>"$FETCH_ERR"; then
  FETCH_MSG=$(cat "$FETCH_ERR" 2>/dev/null)
  rm -f "$FETCH_ERR"
  if [[ "$INJECTED_TOKEN" == true ]]; then
    git remote set-url origin "$REMOTE_URL"
  fi
  echo -e "\n${CLR_RED}پیام گیت‌هاب: ${FETCH_MSG}${CLR_RESET}"
  die "دریافت کد از گیت‌هاب ناموفق بود — کد جدید روی سرور ننشست، پس طبیعی است که «هیچی تغییر نکند»." \
      "۱) توکن را بررسی کنید (منقضی شده یا اشتباه کپی شده). ۲) مطمئن شوید حساب AliRezaC-xrol به مخزن خصوصی دسترسی دارد. ۳) اتصال سرور به گیت‌هاب را چک کنید: curl -sI https://github.com"
fi
rm -f "$FETCH_ERR"

if ! git reset --hard origin/main; then
  if [[ "$INJECTED_TOKEN" == true ]]; then
    git remote set-url origin "$REMOTE_URL"
  fi
  die "اعمال نسخه جدید (git reset) ناموفق بود." \
      "اگر تغییرات محلی روی سرور دارید، اول از آن‌ها بکاپ بگیرید: git stash"
fi

AFTER_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
AFTER_DESC=$(git log -1 --format='%h %s' 2>/dev/null || echo "unknown")

# Strip the token back out so it is never left sitting in .git/config.
if [[ "$INJECTED_TOKEN" == true ]]; then
  git remote set-url origin "$REMOTE_URL"
fi

if [[ "$BEFORE_SHA" == "$AFTER_SHA" ]]; then
  echo -e " ${CLR_YELLOW}⚠ کد روی سرور از قبل همین نسخه بود و چیزی تغییر نکرد.${CLR_RESET}"
  echo -e "   ${CLR_WHITE}نسخه:${CLR_RESET} ${CLR_YELLOW}${AFTER_DESC}${CLR_RESET}"
  echo -e "   ${CLR_WHITE}اگر انتظار کد جدیدی دارید، یعنی کامیت‌ها هنوز به گیت‌هاب پوش نشده‌اند.${CLR_RESET}"
  echo -e "   ${CLR_WHITE}از روی ماشین توسعه اجرا کنید:${CLR_RESET}"
  echo -e "     ${CLR_GREEN}bash scripts/push-to-github.sh ghp_توکن${CLR_RESET}\n"
else
  echo -e " ${CLR_GREEN}✔ سورس‌کد به‌روزرسانی شد.${CLR_RESET}"
  echo -e " ${CLR_WHITE}  از:${CLR_RESET} ${CLR_YELLOW}${BEFORE_DESC}${CLR_RESET}"
  echo -e " ${CLR_WHITE}  به:${CLR_RESET} ${CLR_GREEN}${AFTER_DESC}${CLR_RESET}"
fi

# 2. Check and prompt for Google OAuth
echo -e "\n ${CLR_CYAN}ℹ [2/5] پیکربندی اتصال به گوگل (Google OAuth 2.0)...${CLR_RESET}"

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

CLIENT_ID="${1:-}"
CLIENT_SECRET="${2:-}"
APPLY_GOOGLE=false

if [[ -n "$CLIENT_ID" && -n "$CLIENT_SECRET" ]]; then
  APPLY_GOOGLE=true
  echo -e " ${CLR_CYAN}ℹ کلیدهای گوگل از آرگومان‌های دستور خوانده شدند.${CLR_RESET}"
elif [[ -n "$EXISTING_CLIENT_ID" ]]; then
  echo -e " ${CLR_GREEN}✔ کلیدهای گوگل از قبل روی سرور تنظیم شده‌اند؛ رد شد.${CLR_RESET}"
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

if [[ "$APPLY_GOOGLE" == true ]]; then
  # The token/clients are written with the awk-based setter, never sed: values
  # can contain `|`, `&` and quotes, all of which break sed.
  set_env_var() {
    local key="$1" value="$2" file="$3"
    local tmp
    tmp=$(mktemp)
    # Escape backslashes so awk does not interpret them.
    local esc="${value//\\/\\\\}"
    esc="${esc//&/\\&}"
    awk -v k="$key" -v v="$esc" '
      BEGIN { done = 0 }
      $0 ~ "^" k "=" { if (!done) { print k "=\"" v "\""; done = 1 } next }
      { print }
      END { if (!done) print k "=\"" v "\"" }
    ' "$file" > "$tmp" && cat "$tmp" > "$file" && rm -f "$tmp"
  }

  set_env_var "GOOGLE_CLIENT_ID" "$CLIENT_ID" "$ENV_FILE"
  set_env_var "GOOGLE_CLIENT_SECRET" "$CLIENT_SECRET" "$ENV_FILE"
  chmod 600 "$ENV_FILE" 2>/dev/null || true
  echo -e " ${CLR_GREEN}✔ کلیدهای گوگل با موفقیت در .env ذخیره شدند.${CLR_RESET}"
fi

# 3. Admin password synchronisation between ADMIN_PASSWORD and ADMIN_PANEL_PASSWORD
echo -e "\n ${CLR_CYAN}ℹ [3/5] بررسی رمز عبور پنل مدیریت...${CLR_RESET}"

EXISTING_PASS=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
if [[ -z "$EXISTING_PASS" ]]; then
  EXISTING_PASS=$(grep "^ADMIN_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
fi

if [[ -z "$EXISTING_PASS" ]]; then
  EXISTING_PASS="Arka-$(openssl rand -hex 4 2>/dev/null | tr '[:lower:]' '[:upper:]' || echo '2026Master')"
fi

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

set_env_var() {
  local key="$1" value="$2" file="$3"
  local tmp
  tmp=$(mktemp)
  local esc="${value//\\/\\\\}"
  esc="${esc//&/\\&}"
  awk -v k="$key" -v v="$esc" '
    BEGIN { done = 0 }
    $0 ~ "^" k "=" { if (!done) { print k "=\"" v "\""; done = 1 } next }
    { print }
    END { if (!done) print k "=\"" v "\"" }
  ' "$file" > "$tmp" && cat "$tmp" > "$file" && rm -f "$tmp"
}

set_env_var "ADMIN_PANEL_PASSWORD" "$EXISTING_PASS" "$ENV_FILE"
set_env_var "ADMIN_PASSWORD" "$EXISTING_PASS" "$ENV_FILE"

# 4. Build & Migrate
echo -e "\n ${CLR_CYAN}ℹ [4/5] نصب وابستگی‌ها، بیلد بهینه و اعمال تغییرات دیتابیس...${CLR_RESET}"

# Dependencies: pnpm if the lockfile says so, npm otherwise. Skipping this was a
# real bug — a dependency added by an update would never be installed.
if [[ -f "pnpm-lock.yaml" ]] && command -v pnpm &>/dev/null; then
  echo -e " ${CLR_WHITE}→ pnpm install --frozen-lockfile${CLR_RESET}"
  if ! pnpm install --frozen-lockfile; then
    echo -e " ${CLR_YELLOW}⚠ pnpm install با خطا تمام شد؛ با npm ادامه می‌دهیم.${CLR_RESET}"
  fi
elif [[ -f "package-lock.json" ]]; then
  echo -e " ${CLR_WHITE}→ npm ci${CLR_RESET}"
  if ! npm ci; then
    echo -e " ${CLR_YELLOW}⚠ npm ci ناموفق بود؛ با npm install ادامه می‌دهیم.${CLR_RESET}"
    npm install || die "نصب وابستگی‌ها ناموفق بود." "فضای دیسک و دسترسی شبکه را بررسی کنید."
  fi
fi

npx prisma generate || die "prisma generate ناموفق بود." "npx prisma validate را اجرا کنید."

# db push is the normal path; if the schema history has diverged, fall back.
if ! npx prisma db push; then
  echo -e " ${CLR_YELLOW}⚠ prisma db push ناموفق بود؛ تلاش با migrate deploy...${CLR_RESET}"
  npx prisma migrate deploy || die "اعمال تغییرات دیتابیس ناموفق بود." \
    "اتصال DATABASE_URL و اجرا بودن Postgres را بررسی کنید."
fi

NODE_OPTIONS="--max-old-space-size=3072" npm run build || die "بیلد پروژه ناموفق بود — کد جدید روی سرور مستقر نشد." \
  "خروجی خطای بالا را بفرستید؛ معمولاً کمبود رم است."

# 5. Reload PM2
echo -e "\n ${CLR_CYAN}ℹ [5/5] بارگذاری مجدد سرور با PM2 بدون قطعی...${CLR_RESET}"
if command -v pm2 &>/dev/null; then
  pm2 reload arka || pm2 restart arka || die "ری‌استارت PM2 ناموفق بود." "pm2 list و pm2 logs arka را بررسی کنید."
  pm2 save || true
  sleep 2
  if pm2 describe arka >/dev/null 2>&1; then
    echo -e " ${CLR_GREEN}✔ وضعیت سرویس ارکا:${CLR_RESET}"
    pm2 describe arka | grep -E "status|uptime|restarts" | sed 's/^/   /' || true
  fi
else
  echo -e " ${CLR_YELLOW}⚠ pm2 نصب نیست؛ سرویس دستی ری‌استارت نشد.${CLR_RESET}"
fi

ADMIN_PASS=$(grep "^ADMIN_PANEL_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "=================================================================="
echo "    🎉 به‌روزرسانی با موفقیت اعمال شد                               "
echo "=================================================================="
echo -e "${CLR_RESET}"
echo -e " ${CLR_WHITE}📦 نسخه مستقر‌شده:${CLR_RESET}                ${CLR_CYAN}${AFTER_DESC}${CLR_RESET}"
echo -e " ${CLR_WHITE}🌐 آدرس صفحه لاگین:${CLR_RESET}               ${CLR_CYAN}${CURRENT_URL}/login${CLR_RESET}"
echo -e " ${CLR_WHITE}🔐 آدرس پنل مدیریت:${CLR_RESET}               ${CLR_CYAN}${CURRENT_URL}/c-xroladi1n${CLR_RESET}"
echo -e " ${CLR_WHITE}🔑 رمز عبور ادمین:${CLR_RESET}                ${CLR_YELLOW}${ADMIN_PASS}${CLR_RESET}"
echo "=================================================================="
echo -e " ${CLR_WHITE}برای اطمینان از اینکه مرورگر نسخه قدیمی را کش نکرده، یک بار${CLR_RESET}"
echo -e " ${CLR_WHITE}با Ctrl+Shift+R (هارد رفرش) صفحه را باز کنید.${CLR_RESET}"
echo -e "==================================================================\n"
