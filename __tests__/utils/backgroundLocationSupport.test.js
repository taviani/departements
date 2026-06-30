import * as TaskManager from 'expo-task-manager';
import { canUseBackgroundLocationUpdates } from '../../utils/backgroundLocationSupport';

describe('backgroundLocationSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when TaskManager is available', async () => {
    TaskManager.isAvailableAsync.mockResolvedValue(true);
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
