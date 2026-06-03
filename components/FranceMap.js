import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, G, Circle, Rect } from 'react-native-svg';
import { getPrefectureName } from '../data/prefectures.js';
import getDetailPaths from '../utils/mapDetailData';
import getMapData from '../utils/mapData';
import {
  clamp,
  clampCameraFocus,
  computeCameraForDepartment,
  computeTransformStrokeWidth,
  createDefaultCamera,
  getRenderSize,
  MAX_MAP_SCALE,
  MIN_MAP_SCALE,
  parseViewBoxSize,
  viewBoxDimensionsForScale,
} from '../utils/mapMath';
import { mapPointToScreen } from '../utils/mapProjection';

const AnimatedG = Animated.createAnimatedComponent(G);

const MIN_SCALE = MIN_MAP_SCALE;
const MAX_SCALE = MAX_MAP_SCALE;
const LABEL_CONTAINER_WIDTH = 168;
const ZOOM_ANIMATION_MS = 280;
const ZOOM_EPSILON = 0.001;

const DepartmentPath = memo(
  ({ fill, path, strokeWidth }) => (
    <Path
      d={path}
      fill={fill}
      stroke="#fff"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  (prev, next) =>
    prev.fill === next.fill &&
    prev.path === next.path &&
    prev.strokeWidth === next.strokeWidth
);

DepartmentPath.displayName = 'DepartmentPath';

const HitTarget = memo(
  ({ dept, onPress }) => (
    <Rect
      x={dept.cx - dept.bboxW / 2}
      y={dept.cy - dept.bboxH / 2}
      width={dept.bboxW}
      height={dept.bboxH}
      fill="transparent"
      onPress={onPress}
    />
  ),
  (prev, next) => prev.dept.code === next.dept.code && prev.onPress === next.onPress
);

HitTarget.displayName = 'HitTarget';

const PrefectureMarker = memo(({ dept, strokeScale }) => {
  if (dept.prefectureX == null || dept.prefectureY == null) {
    return null;
  }

  const dotRadius = 4 / strokeScale;
  const innerRadius = 2 / strokeScale;
  const stroke = 2 / strokeScale;

  return (
    <G pointerEvents="none">
      <Circle
        cx={dept.prefectureX}
        cy={dept.prefectureY}
        r={dotRadius}
        fill="#fff"
        stroke="#1565C0"
        strokeWidth={stroke}
      />
      <Circle
        cx={dept.prefectureX}
        cy={dept.prefectureY}
        r={innerRadius}
        fill="#1565C0"
      />
    </G>
  );
});

PrefectureMarker.displayName = 'PrefectureMarker';

const PrefectureLabelOverlay = memo(({ name, position }) => {
  if (!name || !position) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.labelContainer,
        {
          left: position.x - LABEL_CONTAINER_WIDTH / 2,
          top: position.y + 6,
        },
      ]}
    >
      <View style={styles.labelDotMarker} />
      <Text style={styles.labelText} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
});

PrefectureLabelOverlay.displayName = 'PrefectureLabelOverlay';

const FranceMap = forwardRef(
  (
    {
      selectedCode,
      highlightedCodes,
      onDepartmentPress,
      onZoomChange,
      style,
    },
    ref
  ) => {
    const mapData = useMemo(() => getMapData(), []);
    const detailLoadedRef = useRef(false);
    const detailPathsRef = useRef(null);
    const cameraRef = useRef(null);
    const layoutRef = useRef({ width: 0, height: 0 });
    const isGesturingRef = useRef(false);
    const isAnimatingRef = useRef(false);

    const [camera, setCameraState] = useState(null);
    const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
    const [detailReady, setDetailReady] = useState(false);

    const onZoomChangeRef = useRef(onZoomChange);
    const onDepartmentPressRef = useRef(onDepartmentPress);
    onZoomChangeRef.current = onZoomChange;
    onDepartmentPressRef.current = onDepartmentPress;

    const departments = mapData.departments;
    const fullViewBox = mapData.viewBox;
    const { width: fullWidth, height: fullHeight } = useMemo(
      () => parseViewBoxSize(fullViewBox),
      [fullViewBox]
    );

    const defaultCamera = useMemo(
      () => createDefaultCamera(fullWidth, fullHeight),
      [fullWidth, fullHeight]
    );

    const scaleSV = useSharedValue(defaultCamera.scale);
    const focusXSV = useSharedValue(defaultCamera.focusX);
    const focusYSV = useSharedValue(defaultCamera.focusY);
    const layoutWidthSV = useSharedValue(0);
    const layoutHeightSV = useSharedValue(0);
    const gestureStartScale = useSharedValue(1);
    const gestureStartFocusX = useSharedValue(0);
    const gestureStartFocusY = useSharedValue(0);

    if (!cameraRef.current) {
      cameraRef.current = defaultCamera;
    }

    const activeCamera = camera ?? defaultCamera;
    const isZoomed = activeCamera.scale > MIN_SCALE + ZOOM_EPSILON;

    const strokeWidth = useMemo(() => {
      if (!layoutSize.width || !layoutSize.height) {
        return 1;
      }

      const screenPixels = isZoomed ? 1.75 : 1.35;

      return computeTransformStrokeWidth(
        activeCamera.scale,
        layoutSize.width,
        layoutSize.height,
        fullWidth,
        fullHeight,
        screenPixels
      );
    }, [activeCamera.scale, fullHeight, fullWidth, isZoomed, layoutSize]);

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
        cameraRef.current = clamped;
        syncSharedCamera(clamped);
        setCameraState(clamped);
      },
      [fullWidth, fullHeight, syncSharedCamera]
    );

    const notifyZoomChange = useCallback((zoomed) => {
      onZoomChangeRef.current?.(zoomed);
    }, []);

    const loadDetailPaths = useCallback(() => {
      if (detailLoadedRef.current) {
        return;
      }
      detailLoadedRef.current = true;
      InteractionManager.runAfterInteractions(() => {
        detailPathsRef.current = getDetailPaths();
        setDetailReady(true);
      });
    }, []);

    useEffect(() => {
      const task = InteractionManager.runAfterInteractions(loadDetailPaths);
      return () => task.cancel();
    }, [loadDetailPaths]);

    const setGesturing = useCallback((value) => {
      isGesturingRef.current = value;
    }, []);

    const animateCameraTo = useCallback(
      (next, onComplete) => {
        const clamped = clampCameraFocus(next, fullWidth, fullHeight);
        isAnimatingRef.current = true;

        const timingConfig = {
          duration: ZOOM_ANIMATION_MS,
          easing: Easing.out(Easing.cubic),
        };

        const finish = () => {
          isAnimatingRef.current = false;
          setCamera(clamped);
          onComplete?.(clamped);
        };

        scaleSV.value = withTiming(clamped.scale, timingConfig, (finished) => {
          if (finished) {
            runOnJS(finish)();
          }
        });
        focusXSV.value = withTiming(clamped.focusX, timingConfig);
        focusYSV.value = withTiming(clamped.focusY, timingConfig);
      },
      [focusXSV, focusYSV, fullHeight, fullWidth, scaleSV, setCamera]
    );

    const resetCamera = useCallback(() => {
      animateCameraTo(defaultCamera, () => {
        notifyZoomChange(false);
      });
    }, [animateCameraTo, defaultCamera, notifyZoomChange]);

    const commitGestureCamera = useCallback(() => {
      const clamped = clampCameraFocus(
        {
          scale: scaleSV.value,
          focusX: focusXSV.value,
          focusY: focusYSV.value,
        },
        fullWidth,
        fullHeight
      );
      cameraRef.current = clamped;
      syncSharedCamera(clamped);
      setCameraState(clamped);

      const zoomed = clamped.scale > MIN_SCALE + ZOOM_EPSILON;
      notifyZoomChange(zoomed);
      if (zoomed) {
        loadDetailPaths();
      }
    }, [
      focusXSV,
      focusYSV,
      fullHeight,
      fullWidth,
      loadDetailPaths,
      notifyZoomChange,
      scaleSV,
      syncSharedCamera,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        zoomToDepartment(code) {
          const dept = departments.find((item) => item.code === code);
          if (!dept?.cx) {
            return false;
          }

          const tryZoom = () => {
            const { width, height } = layoutRef.current;

            if (!width || !height) {
              requestAnimationFrame(tryZoom);
              return;
            }

            loadDetailPaths();

            const next = computeCameraForDepartment(
              dept,
              width,
              height,
              fullWidth,
              fullHeight
            );

            animateCameraTo(next, () => {
              notifyZoomChange(true);
            });
          };

          tryZoom();
          return true;
        },
        resetZoom() {
          resetCamera();
        },
      }),
      [
        animateCameraTo,
        departments,
        fullHeight,
        fullWidth,
        loadDetailPaths,
        notifyZoomChange,
        resetCamera,
      ]
    );

    const animatedGroupProps = useAnimatedProps(() => {
      const scale = Math.max(scaleSV.value, MIN_SCALE);
      const centerX = fullWidth / 2;
      const centerY = fullHeight / 2;
      return {
        transform: `translate(${centerX} ${centerY}) scale(${scale}) translate(${-focusXSV.value} ${-focusYSV.value})`,
      };
    });

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        gestureStartScale.value = scaleSV.value;
        gestureStartFocusX.value = focusXSV.value;
        gestureStartFocusY.value = focusYSV.value;
        runOnJS(setGesturing)(true);
      })
      .onUpdate((event) => {
        const nextScale = clamp(
          gestureStartScale.value * event.scale,
          MIN_SCALE,
          MAX_SCALE
        );

        if (nextScale <= MIN_SCALE) {
          scaleSV.value = MIN_SCALE;
          focusXSV.value = fullWidth / 2;
          focusYSV.value = fullHeight / 2;
          return;
        }

        scaleSV.value = nextScale;
        focusXSV.value = gestureStartFocusX.value;
        focusYSV.value = gestureStartFocusY.value;
      })
      .onEnd(() => {
        runOnJS(setGesturing)(false);
        runOnJS(commitGestureCamera)();
      });

    const pan = Gesture.Pan()
      .maxPointers(1)
      .minDistance(12)
      .manualActivation(true)
      .onTouchesMove((_, state) => {
        if (scaleSV.value > MIN_SCALE) {
          state.activate();
        } else {
          state.fail();
        }
      })
      .onBegin(() => {
        gestureStartScale.value = scaleSV.value;
        gestureStartFocusX.value = focusXSV.value;
        gestureStartFocusY.value = focusYSV.value;
        runOnJS(setGesturing)(true);
      })
      .onUpdate((event) => {
        if (gestureStartScale.value <= MIN_SCALE) {
          return;
        }

        const { width: vbW, height: vbH } = viewBoxDimensionsForScale(
          gestureStartScale.value,
          fullWidth,
          fullHeight
        );
        const { renderWidth, renderHeight } = getRenderSize(
          layoutWidthSV.value,
          layoutHeightSV.value,
          fullWidth,
          fullHeight
        );

        focusXSV.value =
          gestureStartFocusX.value -
          (event.translationX * vbW) / Math.max(renderWidth, 1);
        focusYSV.value =
          gestureStartFocusY.value -
          (event.translationY * vbH) / Math.max(renderHeight, 1);
        scaleSV.value = gestureStartScale.value;
      })
      .onEnd(() => {
        runOnJS(setGesturing)(false);
        runOnJS(commitGestureCamera)();
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd(() => {
        runOnJS(resetCamera)();
      });

    const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

    const highlightedSet = useMemo(
      () => new Set(highlightedCodes ?? []),
      [highlightedCodes]
    );

    const selectedDept = useMemo(
      () =>
        selectedCode
          ? departments.find((dept) => dept.code === selectedCode)
          : null,
      [departments, selectedCode]
    );

    const detailPaths = detailReady ? detailPathsRef.current : null;

    const handleDepartmentPress = useCallback((code) => {
      if (isGesturingRef.current || isAnimatingRef.current) {
        return;
      }
      onDepartmentPressRef.current?.(code);
    }, []);

    const hitTargets = useMemo(
      () =>
        departments.map((dept) => (
          <HitTarget
            key={`hit-${dept.code}`}
            dept={dept}
            onPress={() => handleDepartmentPress(dept.code)}
          />
        )),
      [departments, handleDepartmentPress]
    );

    const basePaths = useMemo(
      () =>
        departments
          .filter((dept) => dept.code !== selectedCode)
          .map((dept) => {
            const fill =
              highlightedSet.size > 0 && highlightedSet.has(dept.code)
                ? '#90CAF9'
                : '#f0f0f0';

            return (
              <DepartmentPath
                key={dept.code}
                fill={fill}
                path={dept.path}
                strokeWidth={strokeWidth}
              />
            );
          }),
      [departments, highlightedSet, selectedCode, strokeWidth]
    );

    const selectedPath = useMemo(() => {
      if (!selectedDept) {
        return null;
      }

      const path =
        isZoomed && detailPaths?.[selectedDept.code]
          ? detailPaths[selectedDept.code]
          : selectedDept.path;

      return (
        <DepartmentPath
          key={`selected-${selectedDept.code}`}
          fill="#2196F3"
          path={path}
          strokeWidth={strokeWidth}
        />
      );
    }, [detailPaths, isZoomed, selectedDept, strokeWidth]);

    const prefectureLabelPosition = useMemo(() => {
      if (
        !isZoomed ||
        !selectedDept?.prefectureX ||
        !selectedDept?.prefectureY ||
        !layoutSize.width ||
        !layoutSize.height
      ) {
        return null;
      }

      return mapPointToScreen(
        selectedDept.prefectureX,
        selectedDept.prefectureY,
        activeCamera,
        layoutSize.width,
        layoutSize.height,
        fullWidth,
        fullHeight
      );
    }, [activeCamera, fullHeight, fullWidth, isZoomed, layoutSize, selectedDept]);

    const prefectureName = selectedDept
      ? getPrefectureName(selectedDept.code)
      : null;

    return (
      <GestureDetector gesture={composed}>
        <View
          style={[styles.wrapper, style]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            layoutRef.current = { width, height };
            layoutWidthSV.value = width;
            layoutHeightSV.value = height;
            if (layoutSize.width !== width || layoutSize.height !== height) {
              setLayoutSize({ width, height });
            }
          }}
        >
          <Svg
            viewBox={fullViewBox}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={styles.container}
          >
            <AnimatedG animatedProps={animatedGroupProps}>
              <G pointerEvents="none">{basePaths}</G>
              {selectedPath && (
                <G pointerEvents="none">
                  {selectedPath}
                  {!isZoomed && (
                    <PrefectureMarker
                      dept={selectedDept}
                      strokeScale={Math.max(activeCamera.scale, 1)}
                    />
                  )}
                </G>
              )}
              {hitTargets}
            </AnimatedG>
          </Svg>
          {isZoomed && (
            <PrefectureLabelOverlay
              name={prefectureName}
              position={prefectureLabelPosition}
            />
          )}
        </View>
      </GestureDetector>
    );
  }
);

FranceMap.displayName = 'FranceMap';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  labelContainer: {
    position: 'absolute',
    width: LABEL_CONTAINER_WIDTH,
    alignItems: 'center',
  },
  labelDotMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#1565C0',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: '#0D47A1',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

export default memo(FranceMap);
