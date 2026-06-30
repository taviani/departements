import { isRunningInExpoGo } from 'expo';
import * as TaskManager from 'expo-task-manager';
import { canUseBackgroundLocationUpdates } from '../../utils/backgroundLocationSupport';

jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(() => false),
}));

describe('backgroundLocationSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isRunningInExpoGo.mockReturnValue(false);
    TaskManager.isAvailableAsync.mockResolvedValue(true);
  });

  it('returns false in Expo Go even if TaskManager is available', async () => {
    isRunningInExpoGo.mockReturnValue(true);
    TaskManager.isAvailableAsync.mockResolvedValue(true);
    await expect(canUseBackgroundLocationUpdates()).resolves.toBe(false);
  });

  it('returns true when TaskManager is available outside Expo Go', async () => {
    await expect(canUseBackgroundLocationUpdates()).resolves.toBe(true);
  });

  it('returns false when TaskManager is unavailable', async () => {
    TaskManager.isAvailableAsync.mockResolvedValue(false);
    await expect(canUseBackgroundLocationUpdates()).resolves.toBe(false);
  });

  it('returns false when TaskManager throws', async () => {
    TaskManager.isAvailableAsync.mockRejectedValue(new Error('unavailable'));
    await expect(canUseBackgroundLocationUpdates()).resolves.toBe(false);
  });
});
