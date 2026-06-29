const base = require('./app.json').expo;

module.exports = () => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const isStoreBuild = profile === 'production' || profile === 'preview';

  const iosInfoPlist = {
    ITSAppUsesNonExemptEncryption: false,
  };

  if (!isStoreBuild) {
    iosInfoPlist.NSLocalNetworkUsageDescription =
      'This app needs access to your local network to connect to the development server.';
    iosInfoPlist.NSBonjourServices = ['_expo._tcp', '_http._tcp'];
  }

  iosInfoPlist.NSUserNotificationsUsageDescription =
    'Recevoir des rappels et des actualités sur les départements.';

  const plugins = isStoreBuild
    ? ['expo-notifications']
    : ['expo-dev-client', 'expo-notifications'];

  return {
    expo: {
      ...base,
      plugins,
      ios: {
        ...base.ios,
        infoPlist: iosInfoPlist,
      },
      android: {
        ...base.android,
      },
    },
  };
};
