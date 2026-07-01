import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISS_KEY = 'location-recommendation-dismissed';
const LAUNCH_COUNT_KEY = 'app-launch-count';

let launchCountIncrementedThisSession = false;

export const loadLocationRecommendationDismissed = async () => {
  try {
    const raw = await AsyncStorage.getItem(DISMISS_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
};

export const dismissLocationRecommendationForever = async () => {
  await AsyncStorage.setItem(DISMISS_KEY, 'true');
};

export const incrementAppLaunchCount = async () => {
  try {
    const raw = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
    const count = raw ? Number.parseInt(raw, 10) || 0 : 0;
    const next = count + 1;
    await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
};

export const ensureAppLaunchCounted = async () => {
  if (launchCountIncrementedThisSession) {
    return getAppLaunchCount();
  }

  launchCountIncrementedThisSession = true;
  return incrementAppLaunchCount();
};

export const getAppLaunchCount = async () => {
  try {
    const raw = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
    return raw ? Number.parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

export const shouldShowLocationRecommendation = async ({
  permissionLevel,
  launchCount,
}) => {
  if (permissionLevel === 'background') {
    return false;
  }

  const dismissed = await loadLocationRecommendationDismissed();
  if (dismissed) {
    return false;
  }

  return launchCount >= 2;
};
