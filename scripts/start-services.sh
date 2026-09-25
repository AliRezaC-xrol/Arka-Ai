#!/usr/bin/env bash
set -e

echo "[1/4] Checking PostgreSQL service..."
if ! command -v pg_ctlcluster &> /dev/null; then
  sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
fi

sudo pg_ctlcluster 17 main start || true

echo "[2/4] Ensuring database and user exist..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='arka'" | grep -q 1 || \
  (sudo -u postgres psql -c "CREATE USER arka WITH PASSWORD 'arka' SUPERUSER;" && sudo -u postgres psql -c "CREATE DATABASE arka OWNER arka;")

echo "[3/4] Syncing Prisma schema..."
npx prisma generate
npx prisma db push

if [ ! -d ".next" ]; then
  echo "Building Next.js..."
  npm run build
fi

echo "[4/4] Starting Next.js server on 0.0.0.0:3000..."
./node_modules/.bin/next start -H 0.0.0.0 -p 3000
