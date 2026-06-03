#!/usr/bin/env bash
# Scan tracked files for common secret patterns before commit/CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EXCLUDE=(
  ':(exclude)node_modules/*'
  ':(exclude)package-lock.json'
  ':(exclude)scripts/check-secrets.sh'
  ':(exclude).env.example'
  ':(exclude)SECURITY.md'
  ':(exclude)README.md'
  ':(exclude).gitignore'
)

PATTERNS=(
  'EXPO_TOKEN=[A-Za-z0-9_-]{8,}'
  'ghp_[A-Za-z0-9]{20,}'
  'github_pat_[A-Za-z0-9_]{20,}'
  'BEGIN (RSA |EC )?PRIVATE KEY'
  'BEGIN OPENSSH PRIVATE KEY'
  'AIza[0-9A-Za-z_-]{35}'
  '"private_key"[[:space:]]*:[[:space:]]*"-----'
)

fail=0

for pattern in "${PATTERNS[@]}"; do
  if matches=$(git grep -nE "$pattern" -- . "${EXCLUDE[@]}" 2>/dev/null); then
    echo "Possible secret detected (pattern: $pattern):"
    echo "$matches"
    echo
    fail=1
  fi
done

# Block committed env files that may contain secrets.
for env_file in .env .env.local .env.production .env.development; do
  if git ls-files --error-unmatch "$env_file" >/dev/null 2>&1; then
    echo "Env file must not be committed: $env_file"
    fail=1
  fi
done

# Block credential filenames if ever tracked.
for credential_file in \
  google-play-service-account.json \
  credentials.json \
  eas-credentials.json
do
  if git ls-files --error-unmatch "$credential_file" >/dev/null 2>&1; then
    echo "Credential file must not be committed: $credential_file"
    fail=1
  fi
done

# Block common credential file extensions if ever staged.
for ext in p8 p12 jks pem mobileprovision; do
  if tracked=$(git ls-files "*.${ext}" 2>/dev/null); then
    if [ -n "$tracked" ]; then
      echo "Credential file must not be committed:"
      echo "$tracked"
      fail=1
    fi
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "Secret scan failed. Remove secrets from git and rotate any exposed credentials."
  exit 1
fi

echo "Secret scan passed."
