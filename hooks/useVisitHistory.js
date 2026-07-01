import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Location from 'expo-location';
import { visitHistoryCopy } from '../constants/visitHistoryCopy';
import {
  canRecordVisitHistory,
  getLocationPermissionLevel,
  shouldShowVisitHistoryLocationBanner,
  shouldShowVisitHistoryPartialInfo,
} from '../utils/locationPermissionLevel';
import { processLocationSample } from '../utils/departementGeofence';
import {
  defaultVisitConsent,
  defaultVisitSettings,
  deleteAllVisitSessions,
  handleVisitHistoryForLocationSample,
  loadVisitConsent,
  loadVisitSessions,
  loadVisitSettings,
  saveVisitConsent,
  saveVisitSettings,
  computeVisitStats,
  buildVisitIntensityByCode,
} from '../utils/visitHistory';

export function useVisitHistory({ visible = false } = {}) {
  const [consent, setConsent] = useState(null);
  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foregroundLocationStatus, setForegroundLocationStatus] =
    useState('undetermined');
  const [backgroundLocationStatus, setBackgroundLocationStatus] =
    useState('undetermined');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const lastBannerLevelRef = useRef(null);

  const permissionLevel = getLocationPermissionLevel(
    foregroundLocationStatus,
    backgroundLocationStatus
  );

  useEffect(() => {
    if (lastBannerLevelRef.current === permissionLevel) {
      return;
    }
    lastBannerLevelRef.current = permissionLevel;
    setBannerDismissed(false);
  }, [permissionLevel]);

  const refreshLocationPermission = useCallback(async () => {
    try {
      const [foreground, background] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
      ]);
      setForegroundLocationStatus(foreground.status);
      setBackgroundLocationStatus(background.status);
      return {
        foreground: foreground.status,
        background: background.status,
      };
    } catch (error) {
      console.warn('Location permission check failed:', error);
      setForegroundLocationStatus('undetermined');
      setBackgroundLocationStatus('undetermined');
      return {
        foreground: 'undetermined',
        background: 'undetermined',
      };
    }
  }, []);

  const reload = useCallback(async () => {
    const [storedConsent, storedSettings, storedSessions, permissions] =
      await Promise.all([
        loadVisitConsent(),
        loadVisitSettings(),
        loadVisitSessions(),
        refreshLocationPermission(),
      ]);

    setConsent(storedConsent);
    setSettings(storedSettings);
    setSessions(storedSessions);
    setLoading(false);
    return { consent: storedConsent, permissions };
  }, [refreshLocationPermission]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    reload();
  }, [visible, reload]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshLocationPermission();
        reload();
      }
    });

    return () => subscription.remove();
  }, [refreshLocationPermission, reload]);

  const stats = computeVisitStats(sessions ?? []);
  const visitIntensityByCode = buildVisitIntensityByCode(stats.visitCountByCode);

  const setHistoryEnabled = useCallback(
    async (enabled) => {
      const nextConsent = {
        ...defaultVisitConsent,
        ...consent,
        historyEnabled: enabled,
        consentedAt: enabled ? new Date().toISOString() : consent?.consentedAt,
      };
      await saveVisitConsent(nextConsent);
      setConsent(nextConsent);

      if (enabled) {
        const { foreground, background } = await refreshLocationPermission();
        const level = getLocationPermissionLevel(foreground, background);
        if (canRecordVisitHistory(level)) {
          const position = await Location.getLastKnownPositionAsync();
          if (position?.coords) {
            const { currentDepartementCode } = await processLocationSample(
              position.coords.latitude,
              position.coords.longitude,
              position.coords.accuracy
            );
            if (currentDepartementCode) {
              await handleVisitHistoryForLocationSample({
                currentDepartementCode,
                changedDepartementCode: null,
                previousDepartementCode: null,
              });
              const storedSessions = await loadVisitSessions();
              setSessions(storedSessions);
            }
          }
        }
      }

      return nextConsent;
    },
    [consent, refreshLocationPermission]
  );

  const setShowVisitedOnMap = useCallback(
    async (showVisitedOnMap) => {
      const nextSettings = {
        ...defaultVisitSettings,
        ...settings,
        showVisitedOnMap,
      };
      await saveVisitSettings(nextSettings);
      setSettings(nextSettings);
    },
    [settings]
  );

  const deleteHistory = useCallback(async () => {
    await deleteAllVisitSessions();
    setSessions([]);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const showLocationBanner = shouldShowVisitHistoryLocationBanner({
    historyEnabled: Boolean(consent?.historyEnabled),
    permissionLevel,
    bannerDismissed,
    isExpoGo: isRunningInExpoGo(),
  });

  const showPartialTrackingInfo = shouldShowVisitHistoryPartialInfo({
    historyEnabled: Boolean(consent?.historyEnabled),
    permissionLevel,
    isExpoGo: isRunningInExpoGo(),
  });

  const emptyMessage = canRecordVisitHistory(permissionLevel)
    ? visitHistoryCopy.emptyNoVisits
    : visitHistoryCopy.emptyNoLocation;

  return {
    loading,
    consent,
    settings,
    sessions,
    stats,
    visitIntensityByCode,
    permissionLevel,
    foregroundLocationStatus,
    backgroundLocationStatus,
    showLocationBanner: visible && showLocationBanner,
    showPartialTrackingInfo: visible && showPartialTrackingInfo,
    emptyMessage,
    reload,
    refreshLocationPermission,
    setHistoryEnabled,
    setShowVisitedOnMap,
    deleteHistory,
    dismissBanner,
  };
}
