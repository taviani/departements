import AsyncStorage from '@react-native-async-storage/async-storage';
import { findDepartementCodeAt } from './departementGeo';
import { DEPARTEMENT_CHANGE_STABLE_READINGS } from '../constants/locationConfig';

const STORAGE_KEY = 'departement-geofence-state';

export const createGeofenceState = () => ({
  confirmedCode: null,
  pendingCode: null,
  pendingCount: 0,
});

export const loadGeofenceState = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createGeofenceState();
    }
    return { ...createGeofenceState(), ...JSON.parse(raw) };
  } catch {
    return createGeofenceState();
  }
};

export const saveGeofenceState = async (state) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

/**
 * Updates hysteresis state from a GPS reading.
 * Returns the newly confirmed department code when it changes, otherwise null.
 */
export const updateGeofenceState = (state, latitude, longitude, accuracy) => {
  if (accuracy != null && accuracy > 500) {
    return { state, changedCode: null };
  }

  const detectedCode = findDepartementCodeAt(latitude, longitude);
  let next = { ...state };

  if (!detectedCode) {
    next.pendingCode = null;
    next.pendingCount = 0;
    return { state: next, changedCode: null };
  }

  if (detectedCode === next.confirmedCode) {
    next.pendingCode = null;
    next.pendingCount = 0;
    return { state: next, changedCode: null };
  }

  if (detectedCode === next.pendingCode) {
    next.pendingCount += 1;
  } else {
    next.pendingCode = detectedCode;
    next.pendingCount = 1;
  }

  if (next.pendingCount < DEPARTEMENT_CHANGE_STABLE_READINGS) {
    return { state: next, changedCode: null };
  }

  next.confirmedCode = detectedCode;
  next.pendingCode = null;
  next.pendingCount = 0;
  return { state: next, changedCode: detectedCode };
};

export const processLocationSample = async (latitude, longitude, accuracy) => {
  const current = await loadGeofenceState();
  const { state, changedCode } = updateGeofenceState(
    current,
    latitude,
    longitude,
    accuracy
  );

  if (state !== current) {
    await saveGeofenceState(state);
  }

  return {
    currentDepartementCode: state.confirmedCode,
    changedDepartementCode: changedCode,
  };
};
