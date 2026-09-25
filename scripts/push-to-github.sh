#!/usr/bin/env bash
set -e

REPO_NAME="AliRezaC-xrol/arka"

if [ -n "$1" ]; then
  TOKEN="$1"
  echo "Pushing code to private repository https://github.com/${REPO_NAME}.git ..."
  git push "https://${TOKEN}@github.com/${REPO_NAME}.git" main
  echo "Successfully pushed to GitHub!"
else
  echo "========================================================"
  echo "  ARKA — GitHub Push Helper"
  echo "========================================================"
  echo "Usage:"
  echo "  ./scripts/push-to-github.sh <YOUR_GITHUB_TOKEN>"
  echo ""
  echo "Example:"
  echo "  ./scripts/push-to-github.sh ghp_xxxxxxx..."
  echo ""
  echo "Or run standard git push:"
  echo "  git push origin main"
  echo "========================================================"
fi
