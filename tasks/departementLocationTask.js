import * as TaskManager from 'expo-task-manager';
import {
  DEPARTEMENT_LOCATION_TASK,
} from '../constants/locationConfig';
import { processLocationSample } from '../utils/departementGeofence';
import { notifyDepartementChange } from '../utils/departementGeofenceNotifications';
import {
  shouldRecordVisitHistory,
  shouldRunBackgroundGeofence,
} from '../utils/geofenceTrackingPolicy';
import { loadNotificationSettings } from '../utils/notificationStorage';
import { handleVisitHistoryForLocationSample } from '../utils/visitHistory';

const handleDepartementLocationTask = async ({ data, error }) => {
  if (error) {
    return;
  }

  const locations = data?.locations;
  if (!locations?.length) {
    return;
  }

  const [runBackground, recordHistory] = await Promise.all([
    shouldRunBackgroundGeofence(),
    shouldRecordVisitHistory(),
  ]);

  if (!runBackground && !recordHistory) {
    return;
  }

  const latest = locations[locations.length - 1];
  const { coords } = latest;
  if (!coords) {
    return;
  }

  const {
    currentDepartementCode,
    changedDepartementCode,
    previousDepartementCode,
  } = await processLocationSample(
    coords.latitude,
    coords.longitude,
    coords.accuracy
  );

  if (recordHistory) {
    await handleVisitHistoryForLocationSample({
      currentDepartementCode,
      changedDepartementCode,
      previousDepartementCode,
    });
  }

  if (changedDepartementCode) {
    const settings = await loadNotificationSettings();
    if (settings.enabled && settings.departementChanges) {
      await notifyDepartementChange(changedDepartementCode);
    }
  }
};

if (!TaskManager.isTaskDefined(DEPARTEMENT_LOCATION_TASK)) {
  TaskManager.defineTask(
    DEPARTEMENT_LOCATION_TASK,
    handleDepartementLocationTask
  );
}
