import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import {
  defaultNotificationSettings,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../utils/notificationStorage';

const notificationPermissionLabel = (status) => {
  switch (status) {
    case 'granted':
      return 'Autorisées';
    case 'denied':
      return 'Refusées';
    default:
      return 'Non configurées';
  }
};

const locationPermissionLabel = (foregroundStatus, backgroundStatus) => {
  if (foregroundStatus !== 'granted') {
    switch (foregroundStatus) {
      case 'denied':
        return 'Refusée';
      default:
        return 'Non configurée';
    }
  }

  if (backgroundStatus === 'granted') {
    return 'Toujours autorisée';
  }

  return 'Uniquement quand l\'app est active';
};

const needsBackgroundLocationHint = (foregroundStatus, backgroundStatus) =>
  foregroundStatus === 'granted' && backgroundStatus !== 'granted';

export function useNotificationSettings(visible) {
  const [settings, setSettings] = useState(defaultNotificationSettings);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [foregroundLocationStatus, setForegroundLocationStatus] =
    useState('undetermined');
  const [backgroundLocationStatus, setBackgroundLocationStatus] =
    useState('undetermined');
  const [loading, setLoading] = useState(true);

  const refreshLocationPermission = useCallback(async () => {
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
  }, []);

  const refreshPermission = useCallback(async () => {
    const [{ status }, location] = await Promise.all([
      Notifications.getPermissionsAsync(),
      refreshLocationPermission(),
    ]);
    setPermissionStatus(status);
    return { notification: status, ...location };
  }, [refreshLocationPermission]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      const [stored, permissions] = await Promise.all([
        loadNotificationSettings(),
        refreshPermission(),
      ]);
      if (active) {
        setSettings(stored);
        setPermissionStatus(permissions.notification);
        setForegroundLocationStatus(permissions.foreground);
        setBackgroundLocationStatus(permissions.background);
        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [visible, refreshPermission]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshPermission();
      }
    });

    return () => subscription.remove();
  }, [visible, refreshPermission]);

  const updateSettings = useCallback(async (patch) => {
    let nextSettings = defaultNotificationSettings;

    setSettings((current) => {
      nextSettings = { ...current, ...patch };
      return nextSettings;
    });

    await saveNotificationSettings(nextSettings);
  }, []);

  const setEnabled = useCallback(
    async (enabled) => {
      if (enabled) {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        setPermissionStatus(status);
        if (status !== 'granted') {
          await updateSettings({ enabled: false });
          return false;
        }
      }

      await updateSettings({ enabled });
      return true;
    },
    [updateSettings]
  );

  const setDailyDepartement = useCallback(
    async (dailyDepartement) => {
      await updateSettings({ dailyDepartement });
    },
    [updateSettings]
  );

  const setAppUpdates = useCallback(
    async (appUpdates) => {
      await updateSettings({ appUpdates });
    },
    [updateSettings]
  );

  const setDepartementChanges = useCallback(
    async (departementChanges) => {
      await updateSettings({ departementChanges });
    },
    [updateSettings]
  );

  return {
    settings,
    loading,
    permissionStatus,
    foregroundLocationStatus,
    backgroundLocationStatus,
    permissionLabel: notificationPermissionLabel(permissionStatus),
    locationPermissionLabel: locationPermissionLabel(
      foregroundLocationStatus,
      backgroundLocationStatus
    ),
    needsBackgroundLocationHint: needsBackgroundLocationHint(
      foregroundLocationStatus,
      backgroundLocationStatus
    ),
    setEnabled,
    setDailyDepartement,
    setAppUpdates,
    setDepartementChanges,
    refreshPermission,
  };
}
