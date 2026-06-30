/** Minimum movement between GPS updates (metres). */
export const LOCATION_DISTANCE_INTERVAL_M = 300;

/** Require this many consecutive readings before accepting a department change. */
export const DEPARTEMENT_CHANGE_STABLE_READINGS = 2;

export const DEPARTEMENT_LOCATION_TASK = 'departement-location-updates';

export const LOCATION_WATCH_OPTIONS = {
  distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
  timeInterval: 15000,
};

export const BACKGROUND_LOCATION_OPTIONS = {
  distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
  deferredUpdatesInterval: 60000,
  showsBackgroundLocationIndicator: true,
  foregroundService: {
    notificationTitle: 'Départements',
    notificationBody: 'Suivi de votre position pour les alertes de passage.',
    notificationColor: '#2196F3',
  },
};
