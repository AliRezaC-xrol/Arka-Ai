#!/usr/bin/env bash
# Boot the production server on a private port and measure the landing page +
# chat layout with real Chrome at phone and desktop viewports.
set -u

cd "$(dirname "$0")/.." || exit 1

PORT="${PORT:-3177}"
BASE="http://127.0.0.1:${PORT}"
export NODE_PATH="C:/Users/ASUS/.workbuddy-ai/binaries/node/workspace/node_modules"
NODE_BIN="C:/Users/ASUS/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe"

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  exit 0
}
trap cleanup EXIT INT TERM

NODE_OPTIONS="--max-old-space-size=3072" npx next start -p "$PORT" > /tmp/arka-measure-server.log 2>&1 &
SERVER_PID=$!

# Wait for readiness
for _ in $(seq 1 45); do
  if curl -sf -o /dev/null "$BASE/"; then break; fi
  sleep 1
done

if ! curl -sf -o /dev/null "$BASE/"; then
  echo "SERVER DID NOT COME UP"
  tail -20 /tmp/arka-measure-server.log
  exit 1
fi

BASE="$BASE" "$NODE_BIN" scripts/measure-hero.cjs
