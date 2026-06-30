import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Easing, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  cameraToSvgMatrix,
  clampCameraFocus,
  computeCameraForDepartment,
  createDefaultCamera,
  MIN_MAP_SCALE,
} from '../utils/mapMath';

const ZOOM_ANIMATION_MS = 320;
const ZOOM_EPSILON = 0.001;
const ZOOM_FIT_RATIO = 0.48;

export function useMapCamera({
  departments,
  fullWidth,
  fullHeight,
  zoomedCode,
  onZoomChange,
}) {
  const layoutRef = useRef({ width: 0, height: 0 });
  const isAnimatingRef = useRef(false);
  const animationGenerationRef = useRef(0);
  const onZoomChangeRef = useRef(onZoomChange);
  const lastZoomedCodeRef = useRef(null);
  onZoomChangeRef.current = onZoomChange;

  const defaultCamera = useMemo(
    () => createDefaultCamera(fullWidth, fullHeight),
    [fullWidth, fullHeight]
  );

  const [camera, setCameraState] = useState(null);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

  const scaleSV = useSharedValue(defaultCamera.scale);
  const focusXSV = useSharedValue(defaultCamera.focusX);
  const focusYSV = useSharedValue(defaultCamera.focusY);

  const activeCamera = camera ?? defaultCamera;
  const isZoomed = activeCamera.scale > MIN_MAP_SCALE + ZOOM_EPSILON;

  const syncSharedCamera = useCallback(
    (next) => {
      scaleSV.value = next.scale;
      focusXSV.value = next.focusX;
      focusYSV.value = next.focusY;
    },
    [focusXSV, focusYSV, scaleSV]
  );

  const setCamera = useCallback(
    (next) => {
      const clamped = clampCameraFocus(next, fullWidth, fullHeight);
      setCameraState(clamped);
      syncSharedCamera(clamped);
    },
    [fullWidth, fullHeight, syncSharedCamera]
  );

  const animateCameraTo = useCallback(
    (next, onComplete) => {
      const clamped = clampCameraFocus(next, fullWidth, fullHeight);
      const generation = animationGenerationRef.current + 1;
      animationGenerationRef.current = generation;
      isAnimatingRef.current = true;

      const timing = {
        duration: ZOOM_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
      };

      const finish = () => {
        if (animationGenerationRef.current !== generation) {
          return;
        }
        isAnimatingRef.current = false;
        setCamera(clamped);
        onComplete?.(clamped);
      };

      scaleSV.value = withTiming(clamped.scale, timing, (finished) => {
        if (finished) {
          runOnJS(finish)();
        }
      });
      focusXSV.value = withTiming(clamped.focusX, timing);
      focusYSV.value = withTiming(clamped.focusY, timing);
    },
    [focusXSV, focusYSV, fullWidth, fullHeight, scaleSV, setCamera]
  );

  const resetCamera = useCallback(() => {
    animateCameraTo(defaultCamera, () => {
      onZoomChangeRef.current?.(false);
    });
  }, [animateCameraTo, defaultCamera]);

  const zoomToDepartment = useCallback(
    (code) => {
      const dept = departments.find((item) => item.code === code);
      if (!dept) {
        return;
      }

      const tryZoom = () => {
        const { width, height } = layoutRef.current;
        if (!width || !height) {
          requestAnimationFrame(tryZoom);
          return;
        }

        const next = computeCameraForDepartment(
          dept,
          width,
          height,
          fullWidth,
          fullHeight,
          dept.cx,
          dept.cy,
          ZOOM_FIT_RATIO
        );
        animateCameraTo(next, () => onZoomChangeRef.current?.(true));
      };

      tryZoom();
    },
    [animateCameraTo, departments, fullHeight, fullWidth]
  );

  useEffect(() => {
    if (!zoomedCode) {
      if (lastZoomedCodeRef.current !== null) {
        lastZoomedCodeRef.current = null;
        resetCamera();
      }
      return;
    }
    if (layoutSize.width <= 0 || layoutSize.height <= 0) {
      return;
    }
    zoomToDepartment(zoomedCode);
    lastZoomedCodeRef.current = zoomedCode;
  }, [zoomedCode, layoutSize.width, layoutSize.height, resetCamera, zoomToDepartment]);

  const handleLayout = useCallback(
    (width, height) => {
      layoutRef.current = { width, height };
      setLayoutSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    },
    []
  );

  const guardPress = useCallback((callback) => {
    if (isAnimatingRef.current) {
      return;
    }
    callback();
  }, []);

  const animatedGroupProps = useAnimatedProps(() => ({
    matrix: cameraToSvgMatrix(
      scaleSV.value,
      focusXSV.value,
      focusYSV.value,
      fullWidth,
      fullHeight
    ),
  }));

  return {
    activeCamera,
    isZoomed,
    layoutSize,
    handleLayout,
    guardPress,
    animatedGroupProps,
  };
}
