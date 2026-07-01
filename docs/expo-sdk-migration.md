# Migration Expo SDK 54 → 56

Branche de travail : **`feat/expo-sdk-migration`**

Migration en **3 étapes** — ne pas sauter de version SDK.

| Étape | Branche / tag | Objectif |
|-------|---------------|----------|
| **0** | `phase-0-new-arch` | New Architecture stable sur SDK 54 |
| **1** | `phase-1-sdk-55` | SDK 55 + `expo-audio` |
| **2** | `phase-2-sdk-56` | SDK 56 + finitions |

---

## Étape 0 — New Architecture (SDK 54) ← **TU ES ICI**

### Ce qui a changé dans le code
- `ios/Podfile.properties.json` : `"newArchEnabled": "true"` (Android l’avait déjà)

### À faire sur ta machine

```bash
cd departements
git checkout feat/expo-sdk-migration

# 1. Réinstaller les pods iOS (obligatoire)
cd ios && pod install && cd ..

# 2. Tests JS
npm test
npm run check:expo-go

# 3. Simulateur (dev client ou Expo Go)
npm start
# puis i dans le terminal
```

### Dev client (recommandé pour GPS / notifs)

```bash
# Build development sur EAS (iPhone physique)
eas build --profile development --platform ios
```

Installe le build sur l’iPhone, puis :

```bash
npm run dev:client
```

### QA Étape 0 — cocher avant de passer à l’étape 1

- [ ] Carte : tap, zoom strip, teintes visites
- [ ] GPS : dept courant, swipe bas
- [ ] Mon parcours : consent, session dept courant
- [ ] Match : hasard / recherche → splash + son
- [ ] Notifications : toggle, preview (Expo Go)
- [ ] `npm test` vert

### Commit étape 0

```bash
git add ios/Podfile.properties.json docs/expo-sdk-migration.md
git commit -m "Enable New Architecture on iOS (SDK 54 phase 0)."
```

---

## Étape 1 — SDK 55

**Prérequis :** Étape 0 validée sur dev client.

```bash
npx expo install expo@^55.0.0 --fix
npx expo-doctor@latest
```

### Migration audio obligatoire

- Remplacer `expo-av` par `expo-audio` dans `playDepartementMatchSound.js`
- Mettre à jour `jest.setup.js`, `expo-go-policy.json`, `package.json`

```bash
npx expo install expo-audio
npm uninstall expo-av
```

### Natif

```bash
cd ios && pod install && cd ..
npm test
npm run check:expo-go
eas build --profile development --platform ios
```

Refaire la **QA Étape 0** + son match après migration audio.

### Commit

```bash
git commit -am "Upgrade to Expo SDK 55 and migrate match sound to expo-audio."
```

---

## Étape 2 — SDK 56

**Prérequis :** Étape 1 mergée ou commitée.

```bash
npx expo install expo@^56.0.0 --fix
npx expo-doctor@latest
cd ios && pod install && cd ..
```

### Docs à mettre à jour

- `README.md` : SDK 56, Expo Go App Store
- `DEPLOY-IPHONE.md` si mention SDK 54

### Optionnel (recommandé)

- Remplacer `SafeAreaView` (`react-native`) par `react-native-safe-area-context`

### TestFlight

```bash
eas build --profile production --platform ios
```

---

## En cas de problème

| Symptôme | Piste |
|----------|--------|
| Pod install échoue | `cd ios && pod deintegrate && pod install` |
| Metro cache | `npx expo start -c` |
| New Arch crash natif | [Expo New Architecture guide](https://docs.expo.dev/guides/new-architecture/) |
| `expo-doctor` rouge | Corriger avant de continuer |

---

## Références

- [SDK 55 changelog](https://expo.dev/changelog/sdk-55)
- [SDK 56 upgrade blog](https://expo.dev/blog/upgrading-to-sdk-56)
- [Upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
