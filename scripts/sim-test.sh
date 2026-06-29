#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${RCT_METRO_PORT:-8081}"

free_port() {
  local pids
  pids=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing stale process on port $PORT: $pids"
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

metro_ready() {
  curl -sf --max-time 2 "http://127.0.0.1:$PORT/status" >/dev/null 2>&1
}

wait_for_metro() {
  local i
  for i in $(seq 1 40); do
    if metro_ready; then
      return 0
    fi
    sleep 0.5
  done
  echo "Metro did not start on port $PORT" >&2
  return 1
}

cd "$ROOT"

if ! metro_ready; then
  free_port
  echo "Starting Metro for simulator on http://localhost:$PORT"
  EXPO_DEV_SIMULATOR=1 node scripts/start-dev.js >/tmp/departements-metro.log 2>&1 &
  wait_for_metro
else
  echo "Metro already running on port $PORT"
fi

echo "Building and launching iOS simulator..."
npx expo run:ios --no-bundler
