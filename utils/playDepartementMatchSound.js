import { AppState } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { isRunningInExpoGo } from 'expo';

let activeSound = null;

const playSound = async () => {
  if (activeSound) {
    await activeSound.unloadAsync();
    activeSound = null;
  }

  const { sound } = await Audio.Sound.createAsync(
    require('../assets/sounds/departement_match.wav'),
    { shouldPlay: true, volume: 1 }
  );

  activeSound = sound;
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
      if (activeSound === sound) {
        activeSound = null;
      }
    }
  });
};

/**
 * Plays the match fanfare in-app. Required in Expo Go (custom notification
 * sounds are not bundled) and when the app is open on iOS.
 */
export async function playDepartementMatchSoundIfNeeded() {
  if (!isRunningInExpoGo() && AppState.currentState !== 'active') {
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    if (isRunningInExpoGo()) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    await playSound();
  } catch (error) {
    console.warn('Departement match sound playback failed:', error);
  }
}
