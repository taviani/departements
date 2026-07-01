import { getDepartementByCode } from '../../data/departementCatalog';
import {
  MIN_VISIT_DURATION_MS,
  TOP_DEPARTEMENTS_LIMIT,
  TOTAL_PROGRESS_SLOTS,
} from './constants';
import { progressBucket } from './progressBucket';

const sessionDurationMs = (session) => {
  if (!session.exitedAt) {
    return null;
  }
  return new Date(session.exitedAt).getTime() - new Date(session.enteredAt).getTime();
};

export const isValidVisitSession = (session) => {
  const duration = sessionDurationMs(session);
  return duration != null && duration >= MIN_VISIT_DURATION_MS;
};

export const computeVisitStats = (sessions = []) => {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const validSessions = safeSessions.filter(isValidVisitSession);
  const visitedBuckets = new Set();
  const visitCountByCode = {};
  let totalPassages = 0;

  for (const session of validSessions) {
    visitedBuckets.add(progressBucket(session.departementCode));
    visitCountByCode[session.departementCode] =
      (visitCountByCode[session.departementCode] ?? 0) + 1;
    totalPassages += 1;
  }

  const topDepartments = Object.entries(visitCountByCode)
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_DEPARTEMENTS_LIMIT)
    .map(([code, count]) => {
      const departement = getDepartementByCode(code);
      return {
        code,
        count,
        name: departement?.name ?? code,
        number: departement?.number ?? code,
      };
    });

  return {
    visitedCount: visitedBuckets.size,
    totalSlots: TOTAL_PROGRESS_SLOTS,
    progressRatio: visitedBuckets.size / TOTAL_PROGRESS_SLOTS,
    totalPassages,
    visitCountByCode,
    topDepartments,
    validSessionCount: validSessions.length,
  };
};
