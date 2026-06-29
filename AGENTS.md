# Agent instructions

This project is **Expo Go first**. Read and follow:

- [.cursor/rules/expo-go-first.mdc](.cursor/rules/expo-go-first.mdc) — always applies
- [scripts/expo-go-policy.json](scripts/expo-go-policy.json) — machine-enforced checks

## Before finishing any change

```bash
npm run check:expo-go
npm test
```

CI runs the same checks on every push and PR.

## Defaults

- Dev: `npm start` → Expo Go (never `--dev-client` by default)
- Map: SVG `AnimatedG` camera + SVG hit targets; detail-strip zoom only (no pinch/pan)
- Size: lazy-load heavy data; no new production deps without updating the allowlist
