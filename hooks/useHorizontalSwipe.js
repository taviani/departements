import { useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 0.35;
const SWIPE_ACTIVATION_DX = 15;

export function useHorizontalSwipe({ onSwipeLeft, onSwipeRight }) {
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  return useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) =>
          Math.abs(dx) > SWIPE_ACTIVATION_DX &&
          Math.abs(dx) > Math.abs(dy) * 1.5,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderRelease: (_, { dx, vx }) => {
          if (dx >= SWIPE_DISTANCE || vx >= SWIPE_VELOCITY) {
            onSwipeRightRef.current?.();
            return;
          }
          if (dx <= -SWIPE_DISTANCE || vx <= -SWIPE_VELOCITY) {
            onSwipeLeftRef.current?.();
          }
        },
      }).panHandlers,
    []
  );
}
