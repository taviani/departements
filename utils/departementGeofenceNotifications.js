import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isRunningInExpoGo } from 'expo';
import {
  DEPARTEMENT_CHANGE_CHANNEL_ID,
  DEPARTEMENT_MATCH_SOUND,
} from '../constants/notificationConfig';
import { getDepartementByCode } from '../data/departementCatalog';
import { getDepartementChangeNotificationLines } from './departementCopy';
import { playDepartementMatchSoundIfNeeded } from './playDepartementMatchSound';
import { triggerDepartementMatchVibration } from './departementMatchVibration';

export const notifyDepartementChange = async (
  departementCode,
  { preview = false } = {}
) => {
  const departement = getDepartementByCode(departementCode);
  if (!departement) {
    return;
  }

  const lines = getDepartementChangeNotificationLines(departement);
  const notificationSound =
    isRunningInExpoGo() || preview ? 'default' : DEPARTEMENT_MATCH_SOUND;

  triggerDepartementMatchVibration();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: lines.title,
      body: lines.subtitle,
      ...(Platform.OS === 'ios'
        ? {
            subtitle: lines.subtitle,
            interruptionLevel: 'timeSensitive',
          }
        : {
            vibrate: [0, 120, 80, 120],
          }),
      sound: notificationSound,
    },
    trigger: null,
    ...(Platform.OS === 'android' ? { channelId: DEPARTEMENT_CHANGE_CHANNEL_ID } : {}),
  });

  try {
    await playDepartementMatchSoundIfNeeded();
  } catch (error) {
    console.warn('Departement match sound playback failed:', error);
  }
};
