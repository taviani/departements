# Départements

A React Native (Expo) app to explore the 96 metropolitan French départements — with an interactive map, search, and prefecture markers.

## Features

- **Interactive SVG map** — all 96 départements with tap-to-select
- **Zoom** — tap the detail strip to zoom on a département; pinch, pan, and double-tap to reset
- **Prefecture markers** — city dot on the overview map; readable label with background when zoomed
- **Search** — filter by département number or name
- **List & shuffle** — browse the full list or pick a random département
- **Detail strip** — name, number, and region for the selected département
- **Animated splash** — logo reveal on launch

The list and map both cover metropolitan France (96 départements, including Corsica 2A/2B).

## Requirements

- Node.js 20+
- npm
- For device testing: [Expo dev client](https://docs.expo.dev/develop/development-builds/introduction/) (this project uses native modules — Expo Go is not supported)

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

```bash
# Start Metro (generates map data if missing)
npm start

# Run on a connected device or simulator (dev client)
npm run ios
npm run android

# Web
npm run web
```

With Metro running, open the app in your dev client build. For a physical iPhone over the network, use a tunnel:

```bash
npx expo start --dev-client --tunnel
```

## Testing

```bash
npm test
npm run test:watch
```

Tests run on every push and pull request to `main` via [GitHub Actions](.github/workflows/ci.yml).

## Production builds

Store builds use [EAS](https://docs.expo.dev/build/introduction/):

```bash
npm run build:ios
npm run build:android
npm run build:all
```

### GitHub Actions (EAS Build)

The [EAS Build workflow](.github/workflows/eas-build.yml) triggers iOS and Android builds on [EAS Build](https://docs.expo.dev/build/introduction/) servers.

**Run manually:** GitHub → Actions → **EAS Build** → **Run workflow**

**Run on release:** push a tag such as `v1.0.1`

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

Sign in with your Apple Developer account when prompted. After that, GitHub Actions can trigger iOS production builds using the credentials stored on Expo.

The **preview** profile (internal distribution) can be selected in the workflow if you need ad hoc builds before production credentials are ready.

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
├── App.js                      # Main screen: search, list, map, detail strip
├── components/
│   ├── FranceMap.js            # SVG map, gestures, prefecture overlay
│   └── AnimatedSplash.js
├── data/
│   ├── departements.js         # List of 96 metropolitan départements
│   ├── prefectures.json        # Prefecture coordinates (source)
│   └── *.compressed.js         # Gzip-compressed SVG map (overview + detail)
├── scripts/
│   ├── build-map-data.js       # GeoJSON → compressed map tiers
│   └── ensure-map-data.js      # Auto-build map data if missing
├── utils/                      # Map math, projection, search, loaders
├── __tests__/                  # Jest test suites
└── .github/workflows/
    ├── ci.yml                  # Tests + secret scan on push/PR
    └── eas-build.yml           # EAS iOS/Android builds (manual or tag)
```

See also: [SECURITY.md](SECURITY.md)

## Map data

The map uses a two-tier SVG pipeline to keep the app lightweight while staying sharp when zoomed:

| Tier | File | Purpose |
|------|------|---------|
| Overview | `departements-map.compressed.js` | Simplified paths, bundled at startup |
| Detail | `departements-map-detail.compressed.js` | High-resolution path for the selected département, lazy-loaded on zoom |

Camera zoom is implemented with a fixed SVG `viewBox` and a `<G transform>` (reliable on iOS), not dynamic viewBox changes.

Raw `departements.geojson` is gitignored; run `npm run build:map-data` to fetch and rebuild.

## Technologies

- **Expo 53** + **React Native 0.79**
- **react-native-svg** — vector map
- **react-native-gesture-handler** + **Reanimated** — pinch/pan
- **Jest** + **Testing Library** — unit and component tests

## License

MIT
