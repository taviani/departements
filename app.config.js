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

  return {
    expo: {
      ...base,
      plugins: isStoreBuild ? [] : ['expo-dev-client'],
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
