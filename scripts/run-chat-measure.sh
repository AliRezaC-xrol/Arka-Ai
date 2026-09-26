#!/usr/bin/env bash
# Boot the production server on a private port and measure the CHAT page with
# real Chrome at phone, tablet and desktop viewports.
#
# Complements run-measure.sh (which covers the landing page). This one needs a
# session, so it relies on the dev mock-login route — the server is started with
# ALLOW_DEV_AUTH=true for that reason only.
set -u

cd "$(dirname "$0")/.." || exit 1

PORT="${PORT:-3178}"
BASE="http://127.0.0.1:${PORT}"
export NODE_PATH="C:/Users/ASUS/.workbuddy-ai/binaries/node/workspace/node_modules"
NODE_BIN="C:/Users/ASUS/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe"

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  exit 0
}
trap cleanup EXIT INT TERM

ALLOW_DEV_AUTH=true NODE_OPTIONS="--max-old-space-size=3072" npx next start -p "$PORT" > /tmp/arka-chat-server.log 2>&1 &
SERVER_PID=$!

# Wait for readiness. The mock-login route is the real gate: it is a dynamic
# route, so a 2xx there means the server can actually serve the app.
READY=0
for _ in $(seq 1 60); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/session" 2>/dev/null || echo 000)
  if [ "$CODE" = "200" ]; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" != "1" ]; then
  echo "SERVER DID NOT COME UP"
  tail -30 /tmp/arka-chat-server.log
  exit 1
fi

# Give the first route compile a moment so the very first navigation is not a
# cold render that times out.
curl -sf -o /dev/null "$BASE/chat" || true

BASE="$BASE" "$NODE_BIN" scripts/measure-chat.cjs
