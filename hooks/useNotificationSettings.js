import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  defaultNotificationSettings,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../utils/notificationStorage';

const permissionLabel = (status) => {
  switch (status) {
    case 'granted':
      return 'Autorisées';
    case 'denied':
      return 'Refusées';
    default:
      return 'Non configurées';
  }
};

export function useNotificationSettings(visible) {
  const [settings, setSettings] = useState(defaultNotificationSettings);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [loading, setLoading] = useState(true);

  const refreshPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    return status;
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      const [stored, status] = await Promise.all([
        loadNotificationSettings(),
        refreshPermission(),
      ]);
      if (active) {
        setSettings(stored);
        setPermissionStatus(status);
        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
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
        const { status } = await Notifications.requestPermissionsAsync();
        setPermissionStatus(status);
        if (status !== 'granted') {
          await updateSettings({ enabled: false });
          return;
        }
      }

      await updateSettings({ enabled });
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

  return {
    settings,
    loading,
    permissionStatus,
    permissionLabel: permissionLabel(permissionStatus),
    setEnabled,
    setDailyDepartement,
    setAppUpdates,
    refreshPermission,
  };
}
