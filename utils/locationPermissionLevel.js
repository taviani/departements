/**
 * Normalizes Expo foreground/background permission into product levels.
 */
export const getLocationPermissionLevel = (
  foregroundStatus,
  backgroundStatus
) => {
  if (foregroundStatus === 'denied') {
    return 'denied';
  }
  if (foregroundStatus !== 'granted') {
    return 'undetermined';
  }
  if (backgroundStatus === 'granted') {
    return 'background';
  }
  return 'foreground';
};

export const hasRecommendedLocationAccess = (level) => level === 'background';

export const canRecordVisitHistory = (level) =>
  level === 'foreground' || level === 'background';

/**
 * Yellow banner on « Mon parcours » — only when action is still useful.
 * Foreground-only in Expo Go: no banner (Always is unavailable / unreliable).
 */
export const shouldShowVisitHistoryLocationBanner = ({
  historyEnabled,
  permissionLevel,
  bannerDismissed,
  isExpoGo = false,
}) => {
  if (!historyEnabled || bannerDismissed) {
    return false;
  }
  if (hasRecommendedLocationAccess(permissionLevel)) {
    return false;
  }
  if (!canRecordVisitHistory(permissionLevel)) {
    return true;
  }
  if (permissionLevel === 'foreground' && isExpoGo) {
    return false;
  }
  return permissionLevel === 'foreground';
};

export const shouldShowVisitHistoryPartialInfo = ({
  historyEnabled,
  permissionLevel,
  isExpoGo = false,
}) =>
  Boolean(
    historyEnabled &&
      permissionLevel === 'foreground' &&
      isExpoGo
  );
