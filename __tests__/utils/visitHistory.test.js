import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  computeVisitStats,
  progressBucket,
  recordDepartementChange,
  handleVisitHistoryForLocationSample,
  syncVisitSessionWithCurrentDepartement,
  loadVisitSessions,
  saveVisitSessions,
  VISIT_CONSENT_STORAGE_KEY,
  VISIT_SESSIONS_STORAGE_KEY,
  isValidVisitSession,
  buildVisitIntensityByCode,
  intensityFromVisitCount,
} from '../../utils/visitHistory';
import {
  shouldShowLocationRecommendation,
} from '../../utils/locationRecommendationStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const minutesAgo = (minutes) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

describe('visitHistory progressBucket', () => {
  it('groups Corse codes into one bucket', () => {
    expect(progressBucket('2A')).toBe('corse');
    expect(progressBucket('2B')).toBe('corse');
    expect(progressBucket('75')).toBe('75');
  });
});

describe('visitHistory stats', () => {
  it('counts Corse as one slot on 96', () => {
    const sessions = [
      {
        id: '1',
        departementCode: '2A',
        enteredAt: minutesAgo(10),
        exitedAt: minutesAgo(5),
        closedReason: 'geofence',
      },
      {
        id: '2',
        departementCode: '2B',
        enteredAt: minutesAgo(4),
        exitedAt: minutesAgo(1),
        closedReason: 'geofence',
      },
    ];

    const stats = computeVisitStats(sessions);
    expect(stats.visitedCount).toBe(1);
    expect(stats.totalSlots).toBe(96);
    expect(stats.visitCountByCode['2A']).toBe(1);
    expect(stats.visitCountByCode['2B']).toBe(1);
  });

  it('ignores sessions shorter than 2 minutes', () => {
    const sessions = [
      {
        id: '1',
        departementCode: '75',
        enteredAt: minutesAgo(1),
        exitedAt: minutesAgo(0),
        closedReason: 'geofence',
      },
    ];

    expect(isValidVisitSession(sessions[0])).toBe(false);
    expect(computeVisitStats(sessions).visitedCount).toBe(0);
  });
});

describe('visitHistory engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === VISIT_CONSENT_STORAGE_KEY) {
        return JSON.stringify({ historyEnabled: true, consentVersion: 1 });
      }
      if (key === VISIT_SESSIONS_STORAGE_KEY) {
        return JSON.stringify([]);
      }
      return null;
    });
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('does not record without consent', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === VISIT_CONSENT_STORAGE_KEY) {
        return JSON.stringify({ historyEnabled: false, consentVersion: 1 });
      }
      return null;
    });

    const recorded = await recordDepartementChange('75', null);
    expect(recorded).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('records a session on geofence change', async () => {
    const recorded = await recordDepartementChange('75', null);
    expect(recorded).toBe(true);

    const payload = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(payload).toHaveLength(1);
    expect(payload[0].departementCode).toBe('75');
    expect(payload[0].exitedAt).toBeNull();
  });

  it('opens a session for the current department without a border crossing', async () => {
    const recorded = await syncVisitSessionWithCurrentDepartement('75');
    expect(recorded).toBe(true);

    const payload = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(payload).toHaveLength(1);
    expect(payload[0].departementCode).toBe('75');
  });

  it('does not open a session outside metropolitan departments', async () => {
    const recorded = await syncVisitSessionWithCurrentDepartement(null);
    expect(recorded).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('does not duplicate an open session for the same department', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === VISIT_CONSENT_STORAGE_KEY) {
        return JSON.stringify({ historyEnabled: true, consentVersion: 1 });
      }
      if (key === VISIT_SESSIONS_STORAGE_KEY) {
        return JSON.stringify([
          {
            id: 'open',
            departementCode: '75',
            enteredAt: minutesAgo(5),
            exitedAt: null,
            closedReason: null,
          },
        ]);
      }
      return null;
    });

    const recorded = await syncVisitSessionWithCurrentDepartement('75');
    expect(recorded).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('uses current department on first GPS fix via handleVisitHistoryForLocationSample', async () => {
    const recorded = await handleVisitHistoryForLocationSample({
      currentDepartementCode: '69',
      changedDepartementCode: null,
      previousDepartementCode: null,
    });
    expect(recorded).toBe(true);

    const payload = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(payload[0].departementCode).toBe('69');
  });

  it('closes the previous session when changing department', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === VISIT_CONSENT_STORAGE_KEY) {
        return JSON.stringify({ historyEnabled: true, consentVersion: 1 });
      }
      if (key === VISIT_SESSIONS_STORAGE_KEY) {
        return JSON.stringify([
          {
            id: 'open',
            departementCode: '75',
            enteredAt: minutesAgo(30),
            exitedAt: null,
            closedReason: null,
          },
        ]);
      }
      return null;
    });

    await recordDepartementChange('92', '75');
    const payload = JSON.parse(
      AsyncStorage.setItem.mock.calls[0][1]
    );

    expect(payload[0].exitedAt).not.toBeNull();
    expect(payload[1].departementCode).toBe('92');
  });
});

describe('visitHistory intensity', () => {
  it('maps visit counts to tint levels', () => {
    expect(intensityFromVisitCount(0)).toBe(0);
    expect(intensityFromVisitCount(1)).toBe(1);
    expect(intensityFromVisitCount(5)).toBe(3);
    expect(buildVisitIntensityByCode({ 75: 2, 69: 0 })['75']).toBe(2);
  });
});

describe('locationRecommendationStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('does not show after dismiss forever', async () => {
    AsyncStorage.getItem.mockResolvedValue('true');
    const show = await shouldShowLocationRecommendation({
      permissionLevel: 'undetermined',
      launchCount: 5,
    });
    expect(show).toBe(false);
  });

  it('shows from second launch when not dismissed', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const show = await shouldShowLocationRecommendation({
      permissionLevel: 'undetermined',
      launchCount: 2,
    });
    expect(show).toBe(true);
  });

  it('does not show when background access is granted', async () => {
    const show = await shouldShowLocationRecommendation({
      permissionLevel: 'background',
      launchCount: 5,
    });
    expect(show).toBe(false);
  });
});
