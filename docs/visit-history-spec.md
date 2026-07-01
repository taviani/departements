# Historique de visites — spec produit (v1)

Document de référence avant implémentation. Décisions validées le 30/06/2026.

## Objectif

Enregistrer automatiquement les **passages réels** dans les départements français (entrée / sortie / durée), afficher une progression **X / 96**, un classement des départements les plus visités, et une teinte sur la carte — **sans compte obligatoire** (sync cloud = phase ultérieure, opt-in).

---

## Règles métier

### Source des visites : GPS uniquement

| Compte | Ne compte pas |
|--------|---------------|
| Changement de département confirmé par la géofence (`changedDepartementCode`) | Swipe « je suis ici », hasard, recherche, tap carte |
| Session avec `enteredAt` / `exitedAt` | Célébration match / splash UI |
| Durée ≥ seuil configurable (défaut **2 min**) pour valider un dept dans les stats | Position sans changement confirmé |

Le moteur d’historique s’accroche **uniquement** à `processLocationSample` / géofence, **si** le consentement « historique de visites » est activé.

### Corse : 2A ou 2B = 1 slot sur 96

- **Stockage** : sessions par code réel (`2A`, `2B`).
- **Progression X / 96** : 2A et 2B partagent un bucket **`corse`** → au plus **+1** sur les 96.
- **Carte & top visites** : 2A et 2B restent **distincts** (teintes, compteurs par dept).

```ts
function progressBucket(code: string): string {
  if (code === '2A' || code === '2B') return 'corse';
  return code;
}
```

### Définition « visité » (progression)

Au moins **une session clôturée** avec durée ≥ 2 min dans ce bucket (dept ou `corse`).

---

## Géolocalisation : recommandée, jamais imposée

L’application reste **utilisable sans localisation** (carte, recherche, hasard). La géoloc est **fortement recommandée** pour profiter pleinement de l’expérience : indicateur « vous êtes ici », célébrations de passage, alertes, historique de visites et teintes sur la carte.

**Principe UX** : inciter et expliquer, **sans bloquer** la navigation ni forcer une pop-up à chaque ouverture.

### Ce que la géoloc débloque

| Fonction | Sans géoloc | Avec géoloc |
|--------|-------------|-------------|
| Carte, recherche, hasard | ✅ | ✅ |
| 📍 département actuel | ❌ | ✅ |
| Animation / match « vous êtes ici » | ❌ | ✅ |
| Alertes de passage | ❌ | ✅ ( + « Toujours autoriser » en arrière-plan ) |
| Historique de visites | ❌ (état vide + message) | ✅ |

### États permission (réutiliser `useDepartementLocation` / `useNotificationSettings`)

| État | Label UI existant | Historique |
|------|-------------------|------------|
| `undetermined` | Non configurée | Vide — invitation à activer |
| `denied` | Refusée | Vide — lien réglages |
| `foreground` (When In Use) | Uniquement quand l'app est active | ⚠️ **partiel** — enregistrement app ouverte seulement |
| `background` (Always) | Toujours autorisée | ✅ **complet** — en déplacement |

### Messages recommandés (non bloquants)

#### 0. Rappel global app (optionnel, dismissible)

Afficher **une fois** après le splash (ou la 2ᵉ ouverture), dismissible « Ne plus afficher » :

- **Titre** : `Profitez pleinement de l'app`
- **Message** : `Activez la localisation pour voir où vous êtes, être alerté lors de vos passages de département et suivre vos visites sur la carte. L'app reste utilisable sans : aucune coordonnée n'est envoyée à nos serveurs.`
- **Actions** : `Plus tard` · `Activer la localisation` · `Ne plus afficher`

Pas de re-affichage automatique si refusé (accès via Aide / Notifications / Mon parcours).

#### 1. Activation du consentement « Historique de visites »

Le toggle **reste activable** même sans géoloc. L’enregistrement démarre dès que la permission est accordée.

**Si permission absente ou refusée** — au tap sur le toggle ou à l’ouverture de « Mon parcours » :

- **Titre** : `Localisation recommandée`
- **Message** : `Pour enregistrer vos visites automatiquement, autorisez l'accès à votre position. Sans cela, votre historique restera vide — le reste de l'app fonctionne normalement. Seuls les codes département et les horaires sont stockés sur votre appareil.`
- **Actions** : `Plus tard` · `Autoriser la localisation` · (si refusé) `Ouvrir les réglages`

**Si « Quand l'app est active » seulement** — info non bloquante :

- **Titre** : `Suivi partiel possible`
- **Message** : `Vos visites seront enregistrées lorsque l'application est ouverte. Pour un suivi complet en déplacement, nous recommandons « Toujours autoriser ».`
- **Actions** : `Continuer ainsi` · `Activer le suivi complet`

#### 2. Encart — page « Mon parcours »

Afficher tant que la géoloc n’est pas au niveau **recommandé** (non modal, dismissible par session) :

| Condition | Encart |
|-----------|--------|
| Refusée / non configurée | `📍 Activez la localisation pour enregistrer vos visites et voir votre progression.` + `Activer` |
| Foreground seulement | `Pour suivre vos déplacements en continu, activez « Toujours autoriser » dans les réglages.` + `Réglages` |
| Always + consentement ON | Pas d’encart |

État vide sans géoloc : `0 / 96` + texte `Vos visites apparaîtront ici dès que la localisation sera activée.`

#### 3. Carte — hint discret

Si pas de géoloc (ou historique activé sans permission) :

- Une ligne sous le header ou au premier zoom : `Activez la localisation pour voir votre département actuel et vos visites sur la carte.`

#### 4. Consentement retiré

Si l’utilisateur désactive « Historique de visites » :

- `L'enregistrement des visites est arrêté. Vos données existantes sont conservées sur l'appareil.`  
- Options : `Conserver l'historique` / `Supprimer l'historique`

Si l’utilisateur révoque la géoloc dans iOS/Android :

- À la prochaine ouverture : bannière + pause de l’enregistrement (sessions ouvertes clôturées avec `closedReason: 'permission_revoked'`).

#### 5. Aide (`helpInfo.js` — section à ajouter)

**Titre** : `Historique de visites`

- Recommandation forte d’activer la localisation (jamais de saisie manuelle).
- L’app reste utilisable sans ; l’historique reste vide tant que le GPS n’est pas autorisé.
- « Toujours autoriser » recommandé pour un suivi complet, comme pour les alertes de passage.
- Lien vers page Notifications / Réglages système.
- Rappel RGPD : stockage local, export / suppression dans « Mon parcours ».

---

## Consentements RGPD (granulaires)

| Toggle | Défaut | Dépendances |
|--------|--------|-------------|
| Historique de visites (local) | Off | Géoloc recommandée pour enregistrer ; toggle activable sans |
| Compte & synchronisation | Off | Phase 3 — hors scope v1 |
| Statistiques d'usage anonymes | Off | Phase 4 — hors scope v1 |

**Politique de confidentialité** (`legalInfo.js`) : à mettre à jour avant release (actuellement « pas de compte, pas de serveur »).

Droits v1 : export JSON, suppression historique, retrait consentement.

---

## Modèle de données (local)

```ts
VisitSession {
  id: string
  departementCode: string   // "75", "2A", …
  enteredAt: string         // ISO 8601
  exitedAt: string | null
  closedReason: 'geofence' | 'app_background' | 'permission_revoked' | 'stale'
}

VisitConsent {
  historyEnabled: boolean
  consentVersion: number
  consentedAt: string
}
```

Clés AsyncStorage proposées :

- `departement-visit-sessions`
- `departement-visit-consent`

---

## UI v1

### Menu → « Mon parcours »

1. Bannière géoloc (si besoin)
2. **X / 96** + barre de progression (bucket Corse agrégé)
3. Nombre de passages total (optionnel)
4. Top N départements (codes réels, pas bucket)
5. Liens : Historique détaillé · Exporter · Supprimer · Gérer le consentement

### Carte

- Prop `visitIntensityByCode` : 0–4 niveaux selon `visitCount` (échelle log ou quartiles)
- Toggle réglages : « Afficher mes départements visités »

---

## Intégration technique

```
processLocationSample()
  → updateGeofenceState() → changedDepartementCode
  → if historyConsent && location OK:
       visitHistory.onDepartementChanged(prev, next)
```

Ne **pas** appeler depuis `celebrateIfCurrentDepartement`, recherche, ou hasard.

---

## Phases

| Phase | Contenu |
|-------|---------|
| **P1** | Consentement + messages géoloc + historique local + page stats + teinte carte |
| **P2** | Export / suppression + MAJ légale complète |
| **P3** | Compte + sync (Supabase EU) |
| **P4** | Analytics anonymes opt-in |

---

## Copy centralisée (futur)

Prévoir `constants/visitHistoryCopy.js` pour tous les libellés ci-dessus et les réutiliser dans :

- écran consentement onboarding historique ;
- `VisitStatsScreen` (bannières) ;
- alertes (même pattern que `showLocationPermissionAlert` dans `NotificationsScreen.js`) ;
- section aide.

---

## Tests à prévoir

- Pas d’entrée historique sans consentement ni sans `changedDepartementCode`
- 2A seul → progress +1 ; 2A + 2B → progress toujours +1 pour Corse
- Toggle historique activable sans géoloc → état vide + encart recommandation
- Encart « partiel » si foreground only
- Session clôturée si permission révoquée
- Rappel global dismissible : pas de re-affichage après « Ne plus afficher »
