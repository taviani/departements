import { AppState, Platform, Vibration } from 'react-native';

const ANDROID_VIBRATION_PATTERN = [0, 120, 80, 120];

/**
 * Haptic feedback when entering a department. Works with the silent switch on
 * iOS (in-app). On Android in background, the notification channel vibrates.
 */
export function triggerDepartementMatchVibration() {
  const isActive = AppState.currentState === 'active';

  if (Platform.OS === 'android' && !isActive) {
    return;
  }

  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(ANDROID_VIBRATION_PATTERN);
      return;
    }

    Vibration.vibrate();
  } catch (error) {
    console.warn('Departement match vibration failed:', error);
  }
}
