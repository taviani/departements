import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  DEPARTEMENT_CHANGE_CHANNEL_ID,
  DEPARTEMENT_MATCH_SOUND,
} from '../constants/notificationConfig';

let channelsReady = false;

export const ensureNotificationChannels = async () => {
  if (channelsReady || Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(DEPARTEMENT_CHANGE_CHANNEL_ID, {
    name: 'Passage de département',
    description: 'Alertes quand vous entrez dans un nouveau département',
    importance: Notifications.AndroidImportance.HIGH,
    sound: DEPARTEMENT_MATCH_SOUND,
    vibrationPattern: [0, 120, 80, 120],
    enableVibrate: true,
    lightColor: '#E91E63',
  });

  channelsReady = true;
};
