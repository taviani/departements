import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';

describe('useNotificationSettings', () => {
  let appStateHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });

    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      appStateHandler = handler;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    AppState.addEventListener.mockRestore?.();
  });

  it('loads notification and location permission labels when visible', async () => {
    const { result } = renderHook(({ visible }) => useNotificationSettings(visible), {
      initialProps: { visible: true },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissionLabel).toBe('Autorisées');
    expect(result.current.locationPermissionLabel).toBe('Toujours autorisée');
    expect(result.current.needsBackgroundLocationHint).toBe(false);
  });

  it('flags missing background location access', async () => {
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(({ visible }) => useNotificationSettings(visible), {
      initialProps: { visible: true },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.locationPermissionLabel).toBe(
      'Uniquement quand l\'app est active'
    );
    expect(result.current.needsBackgroundLocationHint).toBe(true);
  });

  it('refreshes permissions when the app becomes active', async () => {
    const { result } = renderHook(({ visible }) => useNotificationSettings(visible), {
      initialProps: { visible: true },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    await act(async () => {
      appStateHandler('active');
    });

    await waitFor(() => {
      expect(result.current.needsBackgroundLocationHint).toBe(true);
    });
  });

  it('returns false when notification permission is denied', async () => {
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(({ visible }) => useNotificationSettings(visible), {
      initialProps: { visible: true },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success;
    await act(async () => {
      success = await result.current.setEnabled(true);
    });

    expect(success).toBe(false);
    expect(result.current.settings.enabled).toBe(false);
  });
});
