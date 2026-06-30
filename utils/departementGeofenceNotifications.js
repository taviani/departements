import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  DEPARTEMENT_CHANGE_CHANNEL_ID,
  DEPARTEMENT_MATCH_SOUND,
} from '../constants/notificationConfig';
import { getDepartementByCode } from '../data/departementCatalog';

export const notifyDepartementChange = async (departementCode) => {
  const departement = getDepartementByCode(departementCode);
  if (!departement) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Changement de département !',
      body: `Bienvenue dans le ${departement.number} - ${departement.name}`,
      sound: DEPARTEMENT_MATCH_SOUND,
    },
    trigger: null,
    ...(Platform.OS === 'android' ? { channelId: DEPARTEMENT_CHANGE_CHANNEL_ID } : {}),
  });
};
