import * as TaskManager from 'expo-task-manager';

export async function canUseBackgroundLocationUpdates() {
  try {
    return await TaskManager.isAvailableAsync();
  } catch {
    return false;
  }
}
