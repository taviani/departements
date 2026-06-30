/**
 * Bare workflow: ios/ and android/ are the source of truth for native config.
 * app.json holds the full Expo manifest; this file forwards only JS/tooling fields
 * so expo-doctor does not flag unsynced native properties.
 */
const NATIVE_MANAGED_KEYS = [
  'ios',
  'android',
  'plugins',
  'icon',
  'scheme',
  'userInterfaceStyle',
  'splash',
  'orientation',
  'backgroundColor',
  'primaryColor',
  'notification',
  'androidStatusBar',
  'androidNavigationBar',
  'locales',
];

module.exports = ({ config }) => {
  const result = { ...config };
  for (const key of NATIVE_MANAGED_KEYS) {
    delete result[key];
  }
  return result;
};
