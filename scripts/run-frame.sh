#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.." || exit 1
PORT="${PORT:-3178}"
BASE="http://127.0.0.1:${PORT}"
export NODE_PATH="C:/Users/ASUS/.workbuddy-ai/binaries/node/workspace/node_modules"
NODE_BIN="C:/Users/ASUS/.workbuddy-ai/binaries/node/versions/22.22.2-3/node.exe"
cleanup() { [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null; exit 0; }
trap cleanup EXIT INT TERM
NODE_OPTIONS="--max-old-space-size=3072" npx next start -p "$PORT" > /tmp/arka-frame-server.log 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 45); do curl -sf -o /dev/null "$BASE/" && break; sleep 1; done
curl -sf -o /dev/null "$BASE/" || { echo "SERVER DOWN"; tail -20 /tmp/arka-frame-server.log; exit 1; }
BASE="$BASE" "$NODE_BIN" scripts/measure-frame.cjs
