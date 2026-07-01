import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  DEPARTEMENT_CHANGE_CHANNEL_ID,
  DEPARTEMENT_MATCH_SOUND,
} from '../../constants/notificationConfig';
import { notifyDepartementChange } from '../../utils/departementGeofenceNotifications';

describe('departementGeofenceNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
  });

  it('schedules a department change notification with the custom sound', async () => {
    await notifyDepartementChange('75');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: expect.objectContaining({
        title: 'Bienvenue dans le 75 · Paris',
        body: 'Nouveau département !',
        sound: DEPARTEMENT_MATCH_SOUND,
        ...(Platform.OS === 'ios'
          ? {
              subtitle: 'Nouveau département !',
              interruptionLevel: 'timeSensitive',
            }
          : {
              vibrate: [0, 120, 80, 120],
            }),
      }),
      trigger: null,
      ...(Platform.OS === 'android'
        ? { channelId: DEPARTEMENT_CHANGE_CHANNEL_ID }
        : {}),
    });
    expect(Vibration.vibrate).toHaveBeenCalled();
  });

  it('uses the default sound for preview notifications', async () => {
    await notifyDepartementChange('75', { preview: true });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          sound: 'default',
        }),
      })
    );
  });

  it('ignores unknown department codes', async () => {
    await notifyDepartementChange('999');

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
