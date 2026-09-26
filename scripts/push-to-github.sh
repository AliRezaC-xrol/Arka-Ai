#!/usr/bin/env bash
# ==============================================================================
# ARKA AI — Push the local commits to GitHub
# Proprietary & Confidential — Copyright (c) 2026 AliRezaC-xrol
# ==============================================================================
#
# Why this exists and why it is noisy
#
# The server pulls from GitHub. Nothing you commit locally reaches the server
# until it is pushed. The previous 25-line version of this script pushed and
# said "Successfully pushed!" without ever checking whether it had anything to
# push — so a silent no-op looked identical to a successful push, and the server
# kept serving old code.
#
# This version: verifies the token, counts how far ahead you are, pushes, reads
# the result back from GitHub, and tells you plainly what happened.
#
set -uo pipefail

REPO_NAME="AliRezaC-xrol/arka"
REMOTE_URL="https://github.com/${REPO_NAME}.git"
BRANCH="${BRANCH:-main}"

TOKEN="${1:-${GITHUB_TOKEN:-}}"

echo "========================================================"
echo "  ARKA — ارسال کد به گیت‌هاب"
echo "========================================================"

if [ -z "$TOKEN" ]; then
  cat <<'USAGE'
Usage:
  bash scripts/push-to-github.sh <YOUR_GITHUB_TOKEN>

  یا:
  export GITHUB_TOKEN=ghp_xxx
  bash scripts/push-to-github.sh

ساخت توکن (اگر ندارید):
  ۱. https://github.com/settings/tokens  →  Generate new token (classic)
  ۲. در بخش Scopes، گزینه‌ی «repo» را تیک بزنید (لازم برای مخزن خصوصی)
  ۳. Generate token و کپی کنید — توکن فقط یک بار نمایش داده می‌شود.

توجه: توکن را در فایل یا مخزن ذخیره نکنید؛ فقط به عنوان آرگومان بدهید.
USAGE
  exit 1
fi

if [ ! -d ".git" ]; then
  echo "✖ این پوشه مخزن گیت نیست. از ریشه پروژه اجرا کنید: cd arka"
  exit 1
fi

# ---- What are we about to push? ----
git fetch origin "$BRANCH" >/dev/null 2>&1 || true
AHEAD=$(git rev-list --count "origin/${BRANCH}..HEAD" 2>/dev/null || echo "?")

echo "شاخه:            ${BRANCH}"
echo "کامیت‌های ارسال‌نشده: ${AHEAD}"
if [ "$AHEAD" != "?" ] && [ "$AHEAD" -gt 0 ]; then
  echo "--- این کامیت‌ها ارسال می‌شوند ---"
  git log --oneline "origin/${BRANCH}..HEAD" | sed 's/^/  /'
  echo "--------------------------------"
elif [ "$AHEAD" = "0" ]; then
  echo ""
  echo "ℹ چیزی برای ارسال نیست — گیت‌هاب از قبل همین کد را دارد."
  echo "  اگر روی سرور «هیچی تغییر نمی‌کند»، پس مشکل در سرور نیست؛"
  echo "  کد جدیدی برای گرفتن وجود ندارد تا وقتی کامیت تازه‌ای بسازید."
  exit 0
fi

echo ""
echo "در حال ارسال به ${REMOTE_URL} ..."

# Push. Note: a 403 here almost always means the token lacks the `repo` scope,
# and a 404 means the token cannot see this private repository at all.
PUSH_ERR=$(mktemp)
if ! git push "https://${TOKEN}@github.com/${REPO_NAME}.git" "HEAD:${BRANCH}" 2>"$PUSH_ERR"; then
  MSG=$(cat "$PUSH_ERR" 2>/dev/null)
  rm -f "$PUSH_ERR"
  echo ""
  echo "✖ ارسال ناموفق بود."
  echo "پیام گیت‌هاب:"
  echo "$MSG" | sed 's/^/  /'
  echo ""
  case "$MSG" in
    *"403"*|*"Permission"*|*"denied"*)
      echo "راه‌حل: توکن دسترسی «repo» ندارد. یک توکن classic با اسکوپ repo بسازید." ;;
    *"404"*|*"not found"*|*"Repository not found"*)
      echo "راه‌حل: توکن به این مخزن خصوصی دسترسی ندارد. مطمئن شوید با حساب AliRezaC-xrol ساخته شده." ;;
    *"rejected"*|*"non-fast-forward"*|*"fetch first"*)
      echo "راه‌حل: گیت‌هاب کامیت‌هایی دارد که شما ندارید. اول: git pull --rebase origin ${BRANCH}" ;;
    *"could not read Username"*|*"could not read Password"*|*"Authentication failed"*|*"Invalid username or password"*)
      echo "راه‌حل: توکن اشتباه یا منقضی است (یا با فاصله/علامت اضافه کپی شده). یک توکن تازه با اسکوپ repo بسازید." ;;
    *)
      echo "راه‌حل: متن خطای بالا را بفرستید." ;;
  esac
  exit 1
fi
rm -f "$PUSH_ERR"

# Read the result back from GitHub rather than trusting the local exit code.
REMOTE_SHA=$(git ls-remote "https://${TOKEN}@github.com/${REPO_NAME}.git" "refs/heads/${BRANCH}" 2>/dev/null | awk '{print $1}')
LOCAL_SHA=$(git rev-parse HEAD)

echo ""
if [ -n "$REMOTE_SHA" ] && [ "$REMOTE_SHA" = "$LOCAL_SHA" ]; then
  echo "✔ ارسال موفق بود."
  echo "  گیت‌هاب اکنون روی کامیت: $(git log -1 --format='%h %s')"
  echo ""
  echo "حالا روی سرور اجرا کنید:"
  echo "  cd /var/www/arka && sudo -E GITHUB_TOKEN='<همین توکن>' bash scripts/update-server.sh"
else
  echo "⚠ ارسال دستور موفق بود ولی گیت‌هاب هنوز همان کامیت را نشان نمی‌دهد."
  echo "  محلی:   ${LOCAL_SHA}"
  echo "  گیت‌هاب: ${REMOTE_SHA:-نامشخص}"
  echo "  یک بار دیگر اجرا کنید یا اتصال شبکه را بررسی کنید."
  exit 1
fi
