import { loadNotificationSettings } from './notificationStorage';
import { loadVisitConsent } from './visitHistory';

export const shouldRunBackgroundGeofence = async () => {
  const [settings, consent] = await Promise.all([
    loadNotificationSettings(),
    loadVisitConsent(),
  ]);

  return (
    (settings.enabled && settings.departementChanges) ||
    consent.historyEnabled
  );
};

export const shouldRecordVisitHistory = async () => {
  const consent = await loadVisitConsent();
  return consent.historyEnabled;
};
