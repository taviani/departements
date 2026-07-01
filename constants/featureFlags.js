import { isRunningInExpoGo } from 'expo';

/**
 * Dev-only UI and tooling. Stripped from TestFlight / store builds.
 *
 * - isRunningInExpoGo(): true only in the Expo Go app (SDK 54).
 * - __DEV__: true whenever Metro serves the bundle (Expo Go, dev client, sim).
 *
 * For build-profile flags (preview vs production), use app.config.js `extra`
 * with EAS_BUILD_PROFILE — see README or eas.json env if needed later.
 */
export const isExpoGoDevSession = isRunningInExpoGo();

export const showNotificationPreviewButton = isExpoGoDevSession;
