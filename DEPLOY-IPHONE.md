# Run on your iPhone (local dev)

## Daily development — Expo Go (recommended)

Same simple flow as any Expo app: one command, QR code, hot reload.

### One-time

1. **Node.js 20+** and project deps:
   ```bash
   cd departements
   npm install
   ```

2. **Expo Go** on your iPhone — [App Store](https://apps.apple.com/app/expo-go/id982107779) (SDK **54**).

3. iPhone and Mac on the **same Wi‑Fi**.

### Every day

```bash
npm start
```

(or `npm run dev` — same thing)

- **iPhone:** scan the QR code in the terminal with the Camera app → opens in Expo Go.
- **Simulator:** press **`i`** in the terminal.
- **Web:** press **`w`**.

Edit any `.js` file and save → the app reloads. Press **`r`** in the terminal to force a reload.

No Xcode build, no firewall, no LAN URL to type.

---

## Alternative — custom dev client

Only needed if Expo Go stops working (e.g. after adding an unsupported native package) or for store-like builds on device.

See [DEPLOY-DEV-CLIENT.md](DEPLOY-DEV-CLIENT.md).

---

## Troubleshooting (Expo Go)

| Problem | Fix |
|--------|-----|
| “Project is incompatible with Expo Go” | Update Expo Go from the App Store; project uses SDK 54 |
| QR opens but won’t load | Same Wi‑Fi; try tunnel: `npx expo start --tunnel` |
| Port 8081 busy | `kill $(lsof -tiTCP:8081)` then `npm start` |
| Map gestures feel off | Reload with **`r`**; report if it persists in Expo Go |

## Quick reference

```bash
npm start     # Expo Go dev server (default)
npm test      # run tests
```
