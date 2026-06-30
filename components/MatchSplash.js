import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURRENT_DEPARTEMENT_MATCH_LABEL } from '../utils/departementCopy';

const ZOOM_DURATION = 900;
const TEXT_FADE_DURATION = 400;
const TEXT_DELAY = 350;
const HOLD_DURATION = 700;
const FADE_OUT_DURATION = 380;

export default function MatchSplash({ departement, onFinish }) {
  const heartScale = useRef(new Animated.Value(0.15)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const zoom = Animated.timing(heartScale, {
      toValue: 1.12,
      duration: ZOOM_DURATION,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    });

    const settle = Animated.timing(heartScale, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    const pulse = Animated.sequence([
      Animated.timing(heartPulse, {
        toValue: 1.08,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(heartPulse, {
        toValue: 1,
        duration: 160,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const revealText = Animated.timing(textOpacity, {
      toValue: 1,
      duration: TEXT_FADE_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    const fadeOut = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: FADE_OUT_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    const animation = Animated.sequence([
      zoom,
      settle,
      Animated.delay(TEXT_DELAY),
      Animated.parallel([
        revealText,
        Animated.sequence([Animated.delay(120), pulse]),
      ]),
      Animated.delay(HOLD_DURATION),
      fadeOut,
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onFinish?.();
      }
    });

    return () => {
      animation.stop();
    };
  }, [departement, heartPulse, heartScale, onFinish, overlayOpacity, textOpacity]);

  const combinedHeartScale = Animated.multiply(heartScale, heartPulse);

  return (
    <Animated.View
      style={[styles.container, { opacity: overlayOpacity }]}
      pointerEvents="auto"
      accessibilityLabel={`${CURRENT_DEPARTEMENT_MATCH_LABEL} ${departement.name}`}
    >
      <Animated.View
        style={[styles.heartWrap, { transform: [{ scale: combinedHeartScale }] }]}
      >
        <Ionicons name="heart" size={190} color="#E91E63" />
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
        <Text style={styles.matchLabel}>{CURRENT_DEPARTEMENT_MATCH_LABEL}</Text>
        <Text style={styles.departementNumber}>{departement.number}</Text>
        <Text style={styles.departementName}>{departement.name}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 240, 246, 0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  heartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  matchLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E91E63',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  departementNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  departementName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
});
