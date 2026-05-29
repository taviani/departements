import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

const ZOOM_DURATION = 1200;
const FADE_DURATION = 400;
const HOLD_DURATION = 200;

export default function AnimatedSplash({ onFinish }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const zoom = Animated.timing(scale, {
      toValue: 1,
      duration: ZOOM_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const fade = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: FADE_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    zoom.start(({ finished }) => {
      if (!finished) {
        return;
      }

      setTimeout(() => {
        fade.start(({ finished: fadeFinished }) => {
          if (fadeFinished) {
            onFinish?.();
          }
        });
      }, HOLD_DURATION);
    });
  }, [onFinish, overlayOpacity, scale]);

  return (
    <Animated.View
      style={[styles.container, { opacity: overlayOpacity }]}
      pointerEvents="auto"
    >
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[styles.logo, { transform: [{ scale }] }]}
        accessibilityLabel="Logo France"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
});
