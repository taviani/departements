import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notification-settings';

export const defaultNotificationSettings = {
  enabled: false,
  dailyDepartement: false,
  appUpdates: true,
  departementChanges: false,
};

export const loadNotificationSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultNotificationSettings };
    }
    return { ...defaultNotificationSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultNotificationSettings };
  }
};

export const saveNotificationSettings = async (settings) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
