import * as TaskManager from 'expo-task-manager';
import {
  DEPARTEMENT_LOCATION_TASK,
} from '../constants/locationConfig';
import { loadNotificationSettings } from '../utils/notificationStorage';
import { processLocationSample } from '../utils/departementGeofence';
import { notifyDepartementChange } from '../utils/departementGeofenceNotifications';

TaskManager.defineTask(DEPARTEMENT_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    return;
  }

  const locations = data?.locations;
  if (!locations?.length) {
    return;
  }

  const settings = await loadNotificationSettings();
  if (!settings.enabled || !settings.departementChanges) {
    return;
  }

  const latest = locations[locations.length - 1];
  const { coords } = latest;
  if (!coords) {
    return;
  }

  const { changedDepartementCode } = await processLocationSample(
    coords.latitude,
    coords.longitude,
    coords.accuracy
  );

  if (changedDepartementCode) {
    await notifyDepartementChange(changedDepartementCode);
  }
});
