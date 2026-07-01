import { Platform } from 'react-native';

/** Android notification channel for department crossing alerts. */
export const DEPARTEMENT_CHANGE_CHANNEL_ID = 'departement-change';

/** Bundled sound file (iOS app bundle + Android res/raw). */
export const DEPARTEMENT_MATCH_SOUND = Platform.select({
  ios: 'departement_match.caf',
  default: 'departement_match.wav',
});
