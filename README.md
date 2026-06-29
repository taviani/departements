# Départements

A React Native (Expo) app to explore the 96 metropolitan French départements — with an interactive map, search, and prefecture markers.

## Features

- **Interactive SVG map** — tap-to-select; tap the detail strip to zoom on a département
- **Prefecture** — city dot on overview; readable label when zoomed
- **Search** — swipe right to open search overlay; filter by number or name
- **List & random** — full list in search overlay, or **swipe left** for a random département
- **Detail strip** — name, number, and region for the selected département
- **Animated splash** — logo reveal on launch

The list and map both cover metropolitan France (96 départements, including Corsica 2A/2B).

## Design principles

- **Expo Go first** — `npm start` + QR code is the default dev flow. No Xcode or custom dev client required for day-to-day work.
- **Expo Go–compatible stack** — SDK 54 (`react-native-svg`, Reanimated for detail-strip zoom).
- **Small and simple** — one map asset, minimal dependencies, smallest correct change.

## Requirements

- Node.js 20+
- npm
- **[Expo Go](https://expo.dev/go)** on your phone (SDK 54) for device testing — or press **`i`** for the iOS simulator

## Setup

```bash
git clone https://github.com/taviani/departements.git
cd departements
npm install
```

Map geometry is shipped as compressed SVG data. To regenerate it from GeoJSON:

```bash
npm run build:map-data
```

## Development

**→ [Run on your iPhone](DEPLOY-IPHONE.md)** — Expo Go, one command + QR code.

```bash
npm start
```

- **iPhone:** scan the QR code → opens in **Expo Go**
- **Simulator:** press **`i`**

Edit and save → hot reload. Press **`r`** in the terminal to reload.

### Optional: custom dev client

For native builds on device without Expo Go: [DEPLOY-DEV-CLIENT.md](DEPLOY-DEV-CLIENT.md) (`npm run dev:client`, `npm run ios`).

## Testing

```bash
npm test
npm run test:watch
```

`npm test` runs the **Expo Go policy check** first (`check:expo-go`) — scripts, dependencies, map patterns, and docs must stay Expo Go–compatible.

Tests run on every push and pull request to `main` via [GitHub Actions](.github/workflows/ci.yml).

## Production builds

Store builds use [EAS](https://docs.expo.dev/build/introduction/):

```bash
npm run build:ios
npm run build:android
npm run build:all
```

### GitHub Actions

| Workflow | Trigger | Action |
|----------|---------|--------|
| [ci.yml](.github/workflows/ci.yml) | Push / PR on `main` | Tests + Expo Go policy + secret scan |
| [eas-deploy-ios.yml](.github/workflows/eas-deploy-ios.yml) | **Push on `main`** (merge included) | iOS production build + **TestFlight** (`--auto-submit`) |
| [eas-build.yml](.github/workflows/eas-build.yml) | Manual, or tag `v*` | iOS/Android build only (no submit) |

**After a PR is merged to `main`**, the **Deploy iOS to TestFlight** workflow runs automatically: EAS builds the `production` profile and uploads to TestFlight. Processing on Apple’s side usually takes 10–15 minutes.

**Manual builds (no TestFlight):** GitHub → Actions → **EAS Build** → **Run workflow**

**Release tags:** push `v1.0.1` to trigger [eas-build.yml](.github/workflows/eas-build.yml) for iOS + Android without auto-submit.

#### Required secret

Add this in the repo settings under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | [Expo access token](https://expo.dev/accounts/[account]/settings/access-tokens) for the account that owns the EAS project |

#### iOS credentials (one-time setup)

CI builds run in non-interactive mode. Before the first **production** iOS build from GitHub Actions, run one interactive build locally so EAS can store and validate App Store credentials:

```bash
npx eas build --platform ios --profile production
```

Sign in with your Apple Developer account when prompted. After that, GitHub Actions can trigger iOS production builds and TestFlight uploads using the credentials stored on Expo.

The **preview** profile (internal distribution) can be selected in the manual **EAS Build** workflow if you need ad hoc builds before production credentials are ready.

### iOS production build from CI (step by step)

**One-time setup**

1. **Add GitHub secret**  
   Repo → **Settings → Secrets and variables → Actions → New repository secret**  
   - Name: `EXPO_TOKEN`  
   - Value: [Expo access token](https://expo.dev/settings/access-tokens) for the account that owns this EAS project

2. **Bootstrap iOS App Store credentials (local, once)**  
   CI is non-interactive — EAS must already hold valid App Store signing credentials:

   ```bash
   cd departements
   npx eas login
   npx eas build --platform ios --profile production
   ```

   When prompted:
   - Log in to your **Apple Developer** account
   - Choose your team
   - Let EAS **generate** the distribution certificate and App Store provisioning profile (do not create them manually unless EAS fails)

   Wait for the build to finish successfully. Credentials are stored on Expo’s servers, not in the repo.

3. **Push the workflow** (if not already on `main`)  
   The workflow file is [`.github/workflows/eas-build.yml`](.github/workflows/eas-build.yml).

**Run a production iOS build from CI**

1. GitHub → **Actions** → **EAS Build** → **Run workflow**
2. Set **profile** to `production`
3. Set **platform** to `ios` (or `all` for iOS + Android)
4. Click **Run workflow**
5. Open the job → **Summary** for links to the EAS build dashboard

**Alternative: release tag**

```bash
git tag v1.0.1
git push origin v1.0.1
```

This triggers a production build for **both** platforms.

**After the build**

Submit to TestFlight (local, not CI):

```bash
npx eas submit --platform ios --profile production --latest
```

Then install via the TestFlight app on your iPhone.

Merges to `main` upload to TestFlight automatically via [eas-deploy-ios.yml](.github/workflows/eas-deploy-ios.yml); no local submit needed for that path.

## Security

Secrets must never be committed. See [SECURITY.md](SECURITY.md).

- **Gitignored:** `.env`, `.env.local`, `*.p8`, `*.jks`, keystores, service account JSON
- **GitHub Actions:** only `EXPO_TOKEN` is required for builds (via `${{ secrets.EXPO_TOKEN }}`)
- **Signing:** iOS/Android credentials live on EAS, not in the repository

Before committing:

```bash
npm run check-secrets
```

Every push/PR runs the same scan in CI.

## Project structure

```
departements/
├── App.js                      # Composition root
├── hooks/                      # Selection + map camera state
├── components/
│   ├── FranceMap.js            # SVG map, detail-strip zoom, prefecture marker
│   └── ...
├── data/
│   ├── departements.js         # List of 96 metropolitan départements
│   ├── prefectures.json        # Prefecture coordinates (source)
│   └── departements-map.compressed.js  # Gzip-compressed SVG overview
├── scripts/
│   ├── build-map-data.js       # GeoJSON → compressed overview map
│   └── ensure-map-data.js      # Auto-build map data if missing
├── utils/                      # Map math, projection, search
├── __tests__/
└── .github/workflows/
```

See also: [SECURITY.md](SECURITY.md)

## Map data

The app ships a single gzip-compressed SVG overview (96 départements, ~340 KB in the bundle). Detail-strip zoom animates the camera over this path — no second geometry tier.

| File | Purpose |
|------|---------|
| `departements-map.compressed.js` | Overview paths + centroids + prefecture coords |

Raw `departements.geojson` is gitignored; run `npm run build:map-data` to fetch and rebuild.

## Technologies

- **Expo 54** + **React Native 0.81**
- **react-native-svg** — vector map
- **Jest** + **Testing Library** — unit and component tests

## License

MIT
