import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  DEPARTEMENT_CHANGE_CHANNEL_ID,
  DEPARTEMENT_MATCH_SOUND,
} from '../../constants/notificationConfig';
import { notifyDepartementChange } from '../../utils/departementGeofenceNotifications';

describe('departementGeofenceNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('schedules a department change notification with the custom sound', async () => {
    await notifyDepartementChange('75');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Changement de département !',
        body: 'Bienvenue dans le 75 - Paris',
        sound: DEPARTEMENT_MATCH_SOUND,
      },
      trigger: null,
      ...(Platform.OS === 'android'
        ? { channelId: DEPARTEMENT_CHANGE_CHANNEL_ID }
        : {}),
    });
  });

  it('ignores unknown department codes', async () => {
    await notifyDepartementChange('999');

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
