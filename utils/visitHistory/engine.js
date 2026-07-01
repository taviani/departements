import { CLOSED_REASONS } from './constants';
import {
  loadVisitConsent,
  loadVisitSessions,
  saveVisitSessions,
} from './storage';

const createSessionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const closeOpenSession = (sessions, exitedAt, closedReason) => {
  const openIndex = sessions.findIndex((session) => !session.exitedAt);
  if (openIndex < 0) {
    return sessions;
  }

  const next = [...sessions];
  next[openIndex] = {
    ...next[openIndex],
    exitedAt,
    closedReason,
  };
  return next;
};

/**
 * Called when geofence confirms a department change (GPS only).
 */
export const recordDepartementChange = async (
  changedDepartementCode,
  previousDepartementCode
) => {
  if (!changedDepartementCode) {
    return false;
  }

  const consent = await loadVisitConsent();
  if (!consent.historyEnabled) {
    return false;
  }

  const now = new Date().toISOString();
  let sessions = await loadVisitSessions();
  sessions = closeOpenSession(
    sessions,
    now,
    previousDepartementCode ? CLOSED_REASONS.GEOFENCE : CLOSED_REASONS.GEOFENCE
  );

  sessions.push({
    id: createSessionId(),
    departementCode: changedDepartementCode,
    enteredAt: now,
    exitedAt: null,
    closedReason: null,
  });

  await saveVisitSessions(sessions);
  return true;
};

/**
 * Opens or keeps a session for the geofence-confirmed department without
 * requiring a border crossing (first fix at home, app restart in same dept).
 */
export const syncVisitSessionWithCurrentDepartement = async (departementCode) => {
  if (!departementCode) {
    return false;
  }

  const consent = await loadVisitConsent();
  if (!consent.historyEnabled) {
    return false;
  }

  let sessions = await loadVisitSessions();
  const openIndex = sessions.findIndex((session) => !session.exitedAt);

  if (openIndex >= 0) {
    if (sessions[openIndex].departementCode === departementCode) {
      return false;
    }

    sessions = closeOpenSession(
      sessions,
      new Date().toISOString(),
      CLOSED_REASONS.GEOFENCE
    );
  }

  sessions.push({
    id: createSessionId(),
    departementCode,
    enteredAt: new Date().toISOString(),
    exitedAt: null,
    closedReason: null,
  });

  await saveVisitSessions(sessions);
  return true;
};

/** @deprecated Use syncVisitSessionWithCurrentDepartement */
export const ensureOpenSessionForDepartement = syncVisitSessionWithCurrentDepartement;

/**
 * Single entry point after processLocationSample().
 */
export const handleVisitHistoryForLocationSample = async ({
  currentDepartementCode,
  changedDepartementCode,
  previousDepartementCode,
}) => {
  if (changedDepartementCode) {
    return recordDepartementChange(
      changedDepartementCode,
      previousDepartementCode
    );
  }

  if (currentDepartementCode) {
    return syncVisitSessionWithCurrentDepartement(currentDepartementCode);
  }

  return false;
};

export const closeOpenSessionForReason = async (closedReason) => {
  const sessions = await loadVisitSessions();
  const openIndex = sessions.findIndex((session) => !session.exitedAt);
  if (openIndex < 0) {
    return false;
  }

  const next = closeOpenSession(
    sessions,
    new Date().toISOString(),
    closedReason
  );
  await saveVisitSessions(next);
  return true;
};

export const onPermissionRevoked = async () =>
  closeOpenSessionForReason(CLOSED_REASONS.PERMISSION_REVOKED);

export const onAppBackgrounded = async () =>
  closeOpenSessionForReason(CLOSED_REASONS.APP_BACKGROUND);
