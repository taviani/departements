import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MatchSplashBackground from './MatchSplashBackground';
import { CURRENT_DEPARTEMENT_HERE_LABEL } from '../utils/departementCopy';

const PIN_EMOJI = '📍';

const ZOOM_DURATION = 520;
const SETTLE_DURATION = 140;
const PIN_MOVE_DURATION = 650;
const TEXT_RISE_DURATION = 580;
const READ_HOLD_DURATION = 1100;
const FADE_OUT_DURATION = 400;
const PULSE_UP_DURATION = 160;
const PULSE_DOWN_DURATION = 175;

const smoothStep = (value, toValue, duration) =>
  Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.sin),
    useNativeDriver: true,
  });

const pinWandLoop = (pulse, swayX, bob, wobble, glow) =>
  Animated.loop(
    Animated.parallel([
      Animated.sequence([
        smoothStep(swayX, -16, PULSE_UP_DURATION),
        smoothStep(swayX, 18, PULSE_DOWN_DURATION),
        smoothStep(swayX, -12, PULSE_UP_DURATION),
        smoothStep(swayX, 0, PULSE_DOWN_DURATION),
      ]),
      Animated.sequence([
        smoothStep(bob, -14, PULSE_UP_DURATION),
        smoothStep(bob, 8, PULSE_DOWN_DURATION),
        smoothStep(bob, -10, PULSE_UP_DURATION),
        smoothStep(bob, 0, PULSE_DOWN_DURATION),
      ]),
      Animated.sequence([
        smoothStep(wobble, -1, PULSE_UP_DURATION),
        smoothStep(wobble, 0.9, PULSE_DOWN_DURATION),
        smoothStep(wobble, -0.65, PULSE_UP_DURATION),
        smoothStep(wobble, 0, PULSE_DOWN_DURATION),
      ]),
      Animated.sequence([
        smoothStep(pulse, 1.09, PULSE_UP_DURATION),
        smoothStep(pulse, 1.02, PULSE_DOWN_DURATION),
        smoothStep(pulse, 1.06, PULSE_UP_DURATION),
        smoothStep(pulse, 1, PULSE_DOWN_DURATION),
      ]),
      Animated.sequence([
        smoothStep(glow, 1.16, PULSE_UP_DURATION),
        smoothStep(glow, 0.9, PULSE_DOWN_DURATION),
        smoothStep(glow, 1.1, PULSE_UP_DURATION),
        smoothStep(glow, 0.92, PULSE_DOWN_DURATION),
      ]),
    ])
  );

export default function MatchSplash({ departement, onFinish }) {
  const { width, height } = useWindowDimensions();
  const pinSize = Math.min(width, height) * 0.34;
  const textRiseStart = Math.min(height * 0.16, 108);

  const pinScale = useRef(new Animated.Value(0.08)).current;
  const pinPulse = useRef(new Animated.Value(1)).current;
  const pinSwayX = useRef(new Animated.Value(0)).current;
  const pinBob = useRef(new Animated.Value(0)).current;
  const pinWobble = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.9)).current;
  const pinOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(textRiseStart)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    textSlide.setValue(textRiseStart);
    textOpacity.setValue(0);
    pinOpacity.setValue(1);

    const zoom = Animated.timing(pinScale, {
      toValue: 1.08,
      duration: ZOOM_DURATION,
      easing: Easing.out(Easing.back(1.45)),
      useNativeDriver: true,
    });

    const settle = Animated.timing(pinScale, {
      toValue: 1,
      duration: SETTLE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const pulse = pinWandLoop(pinPulse, pinSwayX, pinBob, pinWobble, glowPulse);

    const revealText = Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: TEXT_RISE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textSlide, {
        toValue: 0,
        duration: TEXT_RISE_DURATION,
        easing: Easing.out(Easing.back(1.18)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(Math.round(TEXT_RISE_DURATION * 0.18)),
        Animated.timing(pinOpacity, {
          toValue: 0,
          duration: Math.round(TEXT_RISE_DURATION * 0.82),
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    const fadeOut = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: FADE_OUT_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    let pulseStarted = false;

    const animation = Animated.sequence([
      zoom,
      settle,
      Animated.delay(PIN_MOVE_DURATION),
      revealText,
      Animated.delay(READ_HOLD_DURATION),
      fadeOut,
    ]);

    const startPulse = () => {
      if (pulseStarted) {
        return;
      }
      pulseStarted = true;
      pulse.start();
    };

    const pulseTimer = setTimeout(startPulse, ZOOM_DURATION + SETTLE_DURATION);

    animation.start(({ finished }) => {
      pulse.stop();
      if (finished) {
        onFinish?.();
      }
    });

    return () => {
      clearTimeout(pulseTimer);
      pulse.stop();
      animation.stop();
    };
  }, [
    departement,
    glowPulse,
    onFinish,
    overlayOpacity,
    pinBob,
    pinOpacity,
    pinPulse,
    pinScale,
    pinSwayX,
    pinWobble,
    textOpacity,
    textRiseStart,
    textSlide,
  ]);

  const combinedPinScale = Animated.multiply(pinScale, pinPulse);
  const pinRotate = pinWobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const glowSize = pinSize * 2.4;

  return (
    <Animated.View
      style={[styles.container, { opacity: overlayOpacity }]}
      pointerEvents="auto"
      accessibilityLabel={`${CURRENT_DEPARTEMENT_HERE_LABEL} ${departement.number} ${departement.name}`}
    >
      <MatchSplashBackground />

      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.pinWrap,
            {
              opacity: pinOpacity,
              transform: [
                { scale: combinedPinScale },
                { translateX: pinSwayX },
                { translateY: pinBob },
                { rotate: pinRotate },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.pinGlow,
              {
                width: glowSize,
                height: glowSize,
                borderRadius: glowSize / 2,
                transform: [{ scale: glowPulse }],
              },
            ]}
          />
          <Text style={[styles.pinEmoji, { fontSize: pinSize }]}>{PIN_EMOJI}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: textOpacity,
              transform: [{ translateY: textSlide }],
            },
          ]}
        >
          <Text style={styles.departementNumber}>{departement.number}</Text>
          <Text style={styles.departementName}>{departement.name}</Text>
          <Text style={styles.hereLabel}>{CURRENT_DEPARTEMENT_HERE_LABEL}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pinGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 90, 50, 0.4)',
  },
  pinEmoji: {
    lineHeight: undefined,
    textAlign: 'center',
  },
  textBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  hereLabel: {
    fontSize: 26,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 14,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(253, 28, 93, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  departementNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  departementName: {
    fontSize: 26,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
