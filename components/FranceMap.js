import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { getPrefectureName } from '../data/prefectures.js';
import getDetailPaths from '../utils/mapDetailData';
import getMapData from '../utils/mapData';
import {
  clamp,
  cameraToTransform,
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

const MIN_SCALE = MIN_MAP_SCALE;
const MAX_SCALE = MAX_MAP_SCALE;
const LABEL_CONTAINER_WIDTH = 168;

const DepartmentPath = memo(
  ({ code, fill, path, strokeWidth, onPress }) => (
    <Path
      d={path}
      fill={fill}
      stroke="#fff"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      onPress={onPress}
    />
  ),
  (prev, next) =>
    prev.code === next.code &&
    prev.fill === next.fill &&
    prev.path === next.path &&
    prev.strokeWidth === next.strokeWidth
);

DepartmentPath.displayName = 'DepartmentPath';

const PrefectureMarker = ({ dept, strokeScale }) => {
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
};

const PrefectureLabelOverlay = ({ name, position }) => {
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
};

const FranceMap = forwardRef(
  (
    {
      selectedCode,
      highlightedCodes,
      isMapZoomed,
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
    const gestureStartRef = useRef(null);
    const layoutRef = useRef({ width: 0, height: 0 });
    const fullSizeRef = useRef({ width: 2000, height: 2150 });
    const cameraScaleSV = useSharedValue(1);

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

    fullSizeRef.current = { width: fullWidth, height: fullHeight };

    const defaultCamera = useMemo(
      () => createDefaultCamera(fullWidth, fullHeight),
      [fullWidth, fullHeight]
    );

    if (!cameraRef.current) {
      cameraRef.current = defaultCamera;
    }

    const activeCamera = camera ?? defaultCamera;

    const mapTransform = useMemo(
      () => cameraToTransform(activeCamera, fullWidth, fullHeight),
      [activeCamera, fullWidth, fullHeight]
    );

    const strokeWidth = useMemo(() => {
      if (!layoutSize.width || !layoutSize.height) {
        return 1;
      }

      const screenPixels = activeCamera.scale > 1.05 ? 1.75 : 1.35;

      return computeTransformStrokeWidth(
        activeCamera.scale,
        layoutSize.width,
        layoutSize.height,
        fullWidth,
        fullHeight,
        screenPixels
      );
    }, [activeCamera.scale, fullHeight, fullWidth, layoutSize]);

    const setCamera = useCallback(
      (next) => {
        const clamped = clampCameraFocus(next, fullWidth, fullHeight);
        cameraRef.current = clamped;
        cameraScaleSV.value = clamped.scale;
        setCameraState(clamped);
      },
      [cameraScaleSV, fullWidth, fullHeight]
    );

    const notifyZoomChange = useCallback((zoomed) => {
      onZoomChangeRef.current?.(zoomed);
    }, []);

    const loadDetailPaths = useCallback(() => {
      if (detailLoadedRef.current) {
        return;
      }
      detailLoadedRef.current = true;
      detailPathsRef.current = getDetailPaths();
      setDetailReady(true);
    }, []);

    const resetCamera = useCallback(() => {
      setCamera(defaultCamera);
      notifyZoomChange(false);
    }, [defaultCamera, notifyZoomChange, setCamera]);

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
            const { width: mapW, height: mapH } = fullSizeRef.current;

            if (!width || !height) {
              requestAnimationFrame(tryZoom);
              return;
            }

            loadDetailPaths();

            const next = computeCameraForDepartment(dept, width, height, mapW, mapH);
            setCamera(next);
            notifyZoomChange(true);
          };

          tryZoom();
          return true;
        },
        resetZoom() {
          resetCamera();
        },
      }),
      [departments, loadDetailPaths, notifyZoomChange, resetCamera, setCamera]
    );

    const applyPinch = useCallback(
      (nextScale) => {
        const start = gestureStartRef.current;
        if (!start) {
          return;
        }

        const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        if (scale <= MIN_SCALE) {
          setCamera(defaultCamera);
          notifyZoomChange(false);
          return;
        }

        setCamera({
          scale,
          focusX: start.focusX,
          focusY: start.focusY,
        });
      },
      [defaultCamera, notifyZoomChange, setCamera]
    );

    const applyPan = useCallback(
      (translationX, translationY) => {
        const start = gestureStartRef.current;
        const { width, height } = layoutRef.current;
        const { width: mapW, height: mapH } = fullSizeRef.current;
        if (!start || !width || !height || start.scale <= MIN_SCALE) {
          return;
        }

        const { width: vbW, height: vbH } = viewBoxDimensionsForScale(
          start.scale,
          mapW,
          mapH
        );
        const { renderWidth, renderHeight } = getRenderSize(
          width,
          height,
          mapW,
          mapH
        );

        setCamera({
          scale: start.scale,
          focusX: start.focusX - (translationX * vbW) / Math.max(renderWidth, 1),
          focusY: start.focusY - (translationY * vbH) / Math.max(renderHeight, 1),
        });
      },
      [setCamera]
    );

    const beginGesture = useCallback(() => {
      const current = cameraRef.current ?? defaultCamera;
      gestureStartRef.current = {
        scale: current.scale,
        focusX: current.focusX,
        focusY: current.focusY,
      };
    }, [defaultCamera]);

    const finishPinch = useCallback(
      (nextScale) => {
        applyPinch(nextScale);
        if (cameraRef.current.scale > MIN_SCALE) {
          notifyZoomChange(true);
          loadDetailPaths();
        }
        gestureStartRef.current = null;
      },
      [applyPinch, loadDetailPaths, notifyZoomChange]
    );

    const applyPinchUpdate = useCallback(
      (pinchScale) => {
        const start = gestureStartRef.current;
        if (!start) {
          return;
        }
        applyPinch(start.scale * pinchScale);
      },
      [applyPinch]
    );

    const finishPinchUpdate = useCallback(
      (pinchScale) => {
        const start = gestureStartRef.current;
        if (!start) {
          return;
        }
        finishPinch(start.scale * pinchScale);
      },
      [finishPinch]
    );

    const finishPan = useCallback(() => {
      gestureStartRef.current = null;
    }, []);

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        runOnJS(beginGesture)();
      })
      .onUpdate((event) => {
        runOnJS(applyPinchUpdate)(event.scale);
      })
      .onEnd((event) => {
        runOnJS(finishPinchUpdate)(event.scale);
      });

    const pan = Gesture.Pan()
      .maxPointers(1)
      .minDistance(12)
      .manualActivation(true)
      .onTouchesMove((_, state) => {
        if (cameraScaleSV.value > MIN_SCALE) {
          state.activate();
        } else {
          state.fail();
        }
      })
      .onBegin(() => {
        runOnJS(beginGesture)();
      })
      .onUpdate((event) => {
        runOnJS(applyPan)(event.translationX, event.translationY);
      })
      .onEnd(() => {
        runOnJS(finishPan)();
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
      () => departments.find((dept) => dept.code === selectedCode),
      [departments, selectedCode]
    );

    const detailPaths = detailReady ? detailPathsRef.current : null;

    const pathForDept = useCallback(
      (dept) => {
        if (
          isMapZoomed &&
          dept.code === selectedCode &&
          detailPaths?.[dept.code]
        ) {
          return detailPaths[dept.code];
        }
        return dept.path;
      },
      [detailPaths, isMapZoomed, selectedCode]
    );

    const pressHandlers = useMemo(() => {
      const handlers = {};
      for (const dept of departments) {
        handlers[dept.code] = () => onDepartmentPressRef.current?.(dept.code);
      }
      return handlers;
    }, [departments]);

    const prefectureLabelPosition = useMemo(() => {
      if (
        !isMapZoomed ||
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
    }, [activeCamera, fullHeight, fullWidth, isMapZoomed, layoutSize, selectedDept]);

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
            setLayoutSize({ width, height });
          }}
        >
          <Svg
            viewBox={fullViewBox}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={styles.container}
          >
            <G transform={mapTransform}>
              {departments.map((dept) => {
                const isSelected = dept.code === selectedCode;
                const isHighlighted =
                  highlightedSet.size > 0 && highlightedSet.has(dept.code);

                let fill = '#f0f0f0';
                if (isSelected) {
                  fill = '#2196F3';
                } else if (isHighlighted) {
                  fill = '#90CAF9';
                }

                return (
                  <DepartmentPath
                    key={dept.code}
                    code={dept.code}
                    fill={fill}
                    path={pathForDept(dept)}
                    strokeWidth={strokeWidth}
                    onPress={pressHandlers[dept.code]}
                  />
                );
              })}
              {selectedDept && !isMapZoomed && (
                <PrefectureMarker
                  dept={selectedDept}
                  strokeScale={Math.max(activeCamera.scale, 1)}
                />
              )}
            </G>
          </Svg>
          {isMapZoomed && (
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

export default FranceMap;
