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
└── .github/workflows/ci.yml    # CI
```

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
