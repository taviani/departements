# Custom dev client (optional)

Use this only if **Expo Go** is not enough — e.g. you added a native module Expo Go does not ship.

For normal JS/UI work, use **`npm start`** and Expo Go ([DEPLOY-IPHONE.md](DEPLOY-IPHONE.md)).

## One-time setup

1. **Xcode** (Mac App Store), **Node.js 20+**, Apple ID in Xcode → Settings → Accounts
2. `npm install` in `departements`
3. iPhone: USB trust, **Developer Mode** (Settings → Privacy & Security)
4. If builds fail with SDK errors:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```

## First install on the phone

```bash
npm run ios
```

Or pick a device by name:

```bash
npx expo run:ios --device "iPhone de Ed"
```

Wait for **Build Succeeded**. The **Departements** dev client appears on the home screen.

## Daily development

**Terminal 1:**

```bash
npm run dev:client
```

**On the iPhone:** open the **Departements** app (not Expo Go).

## Simulator with dev client

```bash
npm run dev:sim    # Terminal 1 — Metro on localhost
npm run ios:sim    # Terminal 2 — build & launch
```

Or one shot: `npm run sim`

## When to rebuild

Run `npm run ios` again after:

- New/updated packages with native code
- Changes to `app.json` iOS settings

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Port 8081 busy | `kill $(lsof -tiTCP:8081)` then restart Metro |
| LAN / won’t connect | `npm run dev:check`; allow **Node** in macOS Firewall |
| Tunnel fails | Use `npm run dev:client` without `--tunnel` on same Wi‑Fi |
| Untrusted developer | Settings → General → VPN & Device Management → trust your Apple ID |

## Quick reference

```bash
npm run dev:client   # Metro for dev client
npm run ios          # build & install on iPhone
npm run dev:check    # LAN diagnostic
```
