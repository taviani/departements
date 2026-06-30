import { useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 0.35;
const SWIPE_ACTIVATION = 15;
const AXIS_DOMINANCE_RATIO = 1.5;

export const resolveSwipeAction = ({ dx, dy, vx, vy }) => {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDy > absDx * AXIS_DOMINANCE_RATIO) {
    if (dy >= SWIPE_DISTANCE || vy >= SWIPE_VELOCITY) {
      return 'down';
    }
    return null;
  }

  if (absDx > absDy * AXIS_DOMINANCE_RATIO) {
    if (dx >= SWIPE_DISTANCE || vx >= SWIPE_VELOCITY) {
      return 'right';
    }
    if (dx <= -SWIPE_DISTANCE || vx <= -SWIPE_VELOCITY) {
      return 'left';
    }
  }

  return null;
};

export function useHorizontalSwipe({ onSwipeLeft, onSwipeRight, onSwipeDown }) {
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const onSwipeDownRef = useRef(onSwipeDown);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;
  onSwipeDownRef.current = onSwipeDown;

  return useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const { dx, dy } = gesture;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          return (
            (absDx > SWIPE_ACTIVATION && absDx > absDy * AXIS_DOMINANCE_RATIO) ||
            (absDy > SWIPE_ACTIVATION && absDy > absDx * AXIS_DOMINANCE_RATIO)
          );
        },
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderRelease: (_, gesture) => {
          const action = resolveSwipeAction(gesture);
          if (action === 'right') {
            onSwipeRightRef.current?.();
            return;
          }
          if (action === 'left') {
            onSwipeLeftRef.current?.();
            return;
          }
          if (action === 'down') {
            onSwipeDownRef.current?.();
          }
        },
      }).panHandlers,
    []
  );
}
