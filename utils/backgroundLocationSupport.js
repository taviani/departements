import { isRunningInExpoGo } from 'expo';
import * as TaskManager from 'expo-task-manager';

export async function canUseBackgroundLocationUpdates() {
  if (isRunningInExpoGo()) {
    return false;
  }

  try {
    return await TaskManager.isAvailableAsync();
  } catch {
    return false;
  }
}
