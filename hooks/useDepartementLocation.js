import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  BACKGROUND_LOCATION_OPTIONS,
  DEPARTEMENT_LOCATION_TASK,
  LOCATION_WATCH_OPTIONS,
} from '../constants/locationConfig';
import { canUseBackgroundLocationUpdates } from '../utils/backgroundLocationSupport';
import { getDepartementByCode } from '../data/departementCatalog';
import { loadNotificationSettings } from '../utils/notificationStorage';
import { processLocationSample } from '../utils/departementGeofence';
import { notifyDepartementChange } from '../utils/departementGeofenceNotifications';

const startBackgroundUpdates = async () => {
  const supported = await canUseBackgroundLocationUpdates();
  if (!supported) {
    return false;
  }

  const hasTask = await Location.hasStartedLocationUpdatesAsync(
    DEPARTEMENT_LOCATION_TASK
  );
  if (hasTask) {
    return true;
  }

  try {
    await Location.startLocationUpdatesAsync(DEPARTEMENT_LOCATION_TASK, {
      ...BACKGROUND_LOCATION_OPTIONS,
      accuracy: Location.Accuracy.Balanced,
    });
    return true;
  } catch (error) {
    console.warn('Background location updates could not start:', error);
    return false;
  }
};

const stopBackgroundUpdates = async () => {
  try {
    const hasTask = await Location.hasStartedLocationUpdatesAsync(
      DEPARTEMENT_LOCATION_TASK
    );
    if (hasTask) {
      await Location.stopLocationUpdatesAsync(DEPARTEMENT_LOCATION_TASK);
    }
  } catch (error) {
    console.warn('Background location updates could not stop:', error);
  }
};

export function useDepartementLocation() {
  const [currentDepartementCode, setCurrentDepartementCode] = useState(null);
  const [locationPermission, setLocationPermission] = useState('undetermined');
  const [matchCelebration, setMatchCelebration] = useState(null);
  const watchRef = useRef(null);
  const settingsRef = useRef(null);
  const lastCelebrationRef = useRef({ code: null, at: 0 });

  const triggerMatchCelebration = useCallback((code, { force = false } = {}) => {
    const departement = getDepartementByCode(code);
    if (!departement) {
      return;
    }

    const now = Date.now();
    if (
      !force &&
      lastCelebrationRef.current.code === code &&
      now - lastCelebrationRef.current.at < 5000
    ) {
      return;
    }

    lastCelebrationRef.current = { code, at: now };
    setMatchCelebration({
      number: departement.number,
      name: departement.name,
    });
  }, []);

  const clearMatchCelebration = useCallback(() => {
    setMatchCelebration(null);
  }, []);

  const refreshSettings = useCallback(async () => {
    settingsRef.current = await loadNotificationSettings();
    return settingsRef.current;
  }, []);

  const handleSample = useCallback(async (latitude, longitude, accuracy) => {
    const { currentDepartementCode: code, changedDepartementCode } =
      await processLocationSample(latitude, longitude, accuracy);

    setCurrentDepartementCode(code);

    if (changedDepartementCode) {
      triggerMatchCelebration(changedDepartementCode);
    }

    const settings = settingsRef.current ?? (await refreshSettings());
    if (
      changedDepartementCode &&
      settings.enabled &&
      settings.departementChanges
    ) {
      await notifyDepartementChange(changedDepartementCode);
    }
  }, [refreshSettings, triggerMatchCelebration]);

  const stopWatching = useCallback(async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    await stopBackgroundUpdates();
  }, []);

  const startWatching = useCallback(async () => {
    await stopWatching();

    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          ...LOCATION_WATCH_OPTIONS,
          accuracy: Location.Accuracy.Balanced,
        },
        (location) => {
          const { latitude, longitude, accuracy } = location.coords;
          handleSample(latitude, longitude, accuracy);
        }
      );
    } catch (error) {
      console.warn('Foreground location watch could not start:', error);
      return;
    }

    const settings = await refreshSettings();
    if (settings.enabled && settings.departementChanges) {
      const background = await Location.getBackgroundPermissionsAsync();
      if (background.status === 'granted') {
        await startBackgroundUpdates();
      }
    }
  }, [handleSample, refreshSettings, stopWatching]);

  const syncTracking = useCallback(async () => {
    const foreground = await Location.getForegroundPermissionsAsync();
    setLocationPermission(foreground.status);

    if (foreground.status !== 'granted') {
      await stopWatching();
      setCurrentDepartementCode(null);
      return foreground.status;
    }

    await startWatching();
    return foreground.status;
  }, [startWatching, stopWatching]);

  const requestForegroundPermission = useCallback(async () => {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') {
      setLocationPermission('granted');
      await startWatching();
      return 'granted';
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    if (status === 'granted') {
      await startWatching();
    }
    return status;
  }, [startWatching]);

  const requestBackgroundPermission = useCallback(async () => {
    const foreground = await requestForegroundPermission();
    if (foreground !== 'granted') {
      return foreground;
    }

    const backgroundSupported = await canUseBackgroundLocationUpdates();
    if (!backgroundSupported) {
      return 'granted';
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
      const settings = await refreshSettings();
      if (settings.enabled && settings.departementChanges) {
        await startBackgroundUpdates();
      }
    }
    return status;
  }, [refreshSettings, requestForegroundPermission]);

  useEffect(() => {
    refreshSettings();
    syncTracking();

    return () => {
      stopWatching();
    };
  }, [refreshSettings, syncTracking, stopWatching]);

  const isCurrentDepartement = useCallback(
    (code) => Boolean(code && currentDepartementCode && code === currentDepartementCode),
    [currentDepartementCode]
  );

  const resolveCurrentDepartementCode = useCallback(async () => {
    if (currentDepartementCode) {
      return currentDepartementCode;
    }

    const foreground = await Location.getForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      const status = await requestForegroundPermission();
      if (status !== 'granted') {
        return null;
      }
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude, accuracy } = position.coords;
      const { currentDepartementCode: code } = await processLocationSample(
        latitude,
        longitude,
        accuracy
      );
      setCurrentDepartementCode(code);
      return code;
    } catch {
      return null;
    }
  }, [currentDepartementCode, requestForegroundPermission]);

  return {
    currentDepartementCode,
    locationPermission,
    matchCelebration,
    isCurrentDepartement,
    resolveCurrentDepartementCode,
    requestForegroundPermission,
    requestBackgroundPermission,
    refreshTracking: syncTracking,
    refreshSettings,
    celebrateMatch: (code) => triggerMatchCelebration(code, { force: true }),
    clearMatchCelebration,
  };
}
