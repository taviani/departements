#!/usr/bin/env bash
# Remind agents of Expo Go-first rules at session start.
cat <<'EOF'
{"additional_context":"Project rule (always enforced): Expo Go first — npm start uses scripts/start-go.js, no --dev-client by default. Keep the app small (minimal deps, lazy-loaded map detail tier). Map uses SVG AnimatedG + HitTarget + Gesture.Native(). Run npm run check:expo-go before finishing. Policy: scripts/expo-go-policy.json, rule: .cursor/rules/expo-go-first.mdc, AGENTS.md."}
EOF
exit 0
