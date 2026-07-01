import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VISIT_CONSENT_STORAGE_KEY,
  VISIT_CONSENT_VERSION,
  VISIT_SESSIONS_STORAGE_KEY,
  VISIT_SETTINGS_STORAGE_KEY,
} from './constants';

export const defaultVisitConsent = {
  historyEnabled: false,
  consentVersion: VISIT_CONSENT_VERSION,
  consentedAt: null,
};

export const defaultVisitSettings = {
  showVisitedOnMap: true,
  // P3: accountSyncEnabled — reserved for cloud sync opt-in
  // P4: anonymousAnalyticsEnabled — reserved for telemetry opt-in
};

export const loadVisitSessions = async () => {
  try {
    const raw = await AsyncStorage.getItem(VISIT_SESSIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveVisitSessions = async (sessions) => {
  await AsyncStorage.setItem(
    VISIT_SESSIONS_STORAGE_KEY,
    JSON.stringify(sessions)
  );
};

export const loadVisitConsent = async () => {
  try {
    const raw = await AsyncStorage.getItem(VISIT_CONSENT_STORAGE_KEY);
    if (!raw) {
      return { ...defaultVisitConsent };
    }
    return { ...defaultVisitConsent, ...JSON.parse(raw) };
  } catch {
    return { ...defaultVisitConsent };
  }
};

export const saveVisitConsent = async (consent) => {
  await AsyncStorage.setItem(VISIT_CONSENT_STORAGE_KEY, JSON.stringify(consent));
};

export const loadVisitSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(VISIT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...defaultVisitSettings };
    }
    return { ...defaultVisitSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultVisitSettings };
  }
};

export const saveVisitSettings = async (settings) => {
  await AsyncStorage.setItem(
    VISIT_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings)
  );
};
