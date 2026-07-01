export {
  CLOSED_REASONS,
  MIN_VISIT_DURATION_MS,
  TOTAL_PROGRESS_SLOTS,
  VISIT_CONSENT_STORAGE_KEY,
  VISIT_CONSENT_VERSION,
  VISIT_SESSIONS_STORAGE_KEY,
  VISIT_SETTINGS_STORAGE_KEY,
} from './constants';
export { progressBucket } from './progressBucket';
export {
  defaultVisitConsent,
  defaultVisitSettings,
  loadVisitConsent,
  loadVisitSessions,
  loadVisitSettings,
  saveVisitConsent,
  saveVisitSessions,
  saveVisitSettings,
} from './storage';
export {
  computeVisitStats,
  isValidVisitSession,
} from './stats';
export {
  buildVisitIntensityByCode,
  intensityFromVisitCount,
} from './intensity';
export {
  closeOpenSessionForReason,
  ensureOpenSessionForDepartement,
  handleVisitHistoryForLocationSample,
  onAppBackgrounded,
  onPermissionRevoked,
  recordDepartementChange,
  syncVisitSessionWithCurrentDepartement,
} from './engine';
export {
  deleteAllVisitSessions,
  exportVisitHistoryJSON,
  exportVisitHistoryPayload,
} from './export';
