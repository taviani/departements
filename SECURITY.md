# Security

## Never commit

- Expo access tokens (`EXPO_TOKEN`)
- Apple ID passwords or App Store Connect API keys (`.p8`)
- Android keystores (`.jks`), certificates (`.p12`), provisioning profiles
- Google Play service account JSON
- Any `.env` file containing real credentials

## Where secrets belong

| Secret | Storage |
|--------|---------|
| `EXPO_TOKEN` | GitHub Actions → Settings → Secrets and variables → Actions |
| Apple signing | EAS servers (created during first interactive iOS build) |
| Android keystore | EAS servers |
| Local dev overrides | `.env.local` (gitignored) |

## Safe to commit

- `app.json` / `eas.json` (bundle IDs, EAS project ID)
- `.env.example` (variable names only, no values)
- GitHub workflow files referencing `${{ secrets.* }}`

## Before committing

```bash
npm run check-secrets
git diff
```

## If a secret was committed

1. Revoke and rotate the credential immediately.
2. Remove it from git history if it reached GitHub.
3. Do not rely on deleting the file in a follow-up commit — the secret remains in history.

## CI

Every push and pull request runs `scripts/check-secrets.sh` via GitHub Actions.
