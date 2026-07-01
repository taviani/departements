/**
 * P2 hooks — export / delete without UI coupling.
 * VisitJourneyScreen will wire Share and confirmation dialogs in P2.
 */
import { VISIT_CONSENT_VERSION } from './constants';
import {
  loadVisitConsent,
  loadVisitSessions,
  saveVisitSessions,
} from './storage';

export const exportVisitHistoryPayload = async () => {
  const [sessions, consent] = await Promise.all([
    loadVisitSessions(),
    loadVisitConsent(),
  ]);

  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    consentVersion: VISIT_CONSENT_VERSION,
    consent,
    sessions,
  };
};

export const exportVisitHistoryJSON = async () =>
  JSON.stringify(await exportVisitHistoryPayload(), null, 2);

export const deleteAllVisitSessions = async () => {
  await saveVisitSessions([]);
};
