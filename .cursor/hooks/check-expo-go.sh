#!/usr/bin/env bash
# Cursor afterFileEdit hook — re-run Expo Go policy checks after agent edits.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if ! node scripts/check-expo-go.js; then
  echo '{"followup_message":"Expo Go policy check failed. Fix violations in scripts/expo-go-policy.json / .cursor/rules/expo-go-first.mdc before continuing."}' 
  exit 2
fi

echo '{}'
exit 0
