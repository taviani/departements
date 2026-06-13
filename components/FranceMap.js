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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { getPrefectureName } from '../data/prefectures.js';
import getDetailPaths from '../utils/mapDetailData';
import getMapData from '../utils/mapData';
import {
  clamp,
  clampCameraFocus,
  cameraToViewStyleTransform,
  computeCameraForDepartment,
  createDefaultCamera,
  focusForMapPointAtScreenWorklet,
  getRenderSize,
  MAX_MAP_SCALE,
  MIN_MAP_SCALE,
  parseViewBoxSize,
  screenPointToMapWorklet,
  viewBoxDimensionsForScale,
} from '../utils/mapMath';
import {
  findDepartmentAtMapPoint,
  mapPointToScreen,
  screenPointToMap,
} from '../utils/mapProjection';

const AnimatedMapLayer = Animated.createAnimatedComponent(View);
const AnimatedLabelLayer = Animated.createAnimatedComponent(View);

const MIN_SCALE = MIN_MAP_SCALE;
const MAX_SCALE = MAX_MAP_SCALE;
const LABEL_CONTAINER_WIDTH = 168;
const ZOOM_ANIMATION_MS = 280;
const ZOOM_EPSILON = 0.001;
const DETAIL_PATH_DELAY_MS = 450;

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

const MapSvgContent = memo(
  ({
    viewBox,
    basePath,
    highlightPaths,
    selectedPath,
    selectedDept,
    showPrefectureMarker,
    markerScale,
  }) => (
    <Svg
      viewBox={viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={styles.container}
      pointerEvents="none"
    >
      <Path d={basePath} fill="#f0f0f0" pointerEvents="none" />
      {highlightPaths.length > 0 && (
        <G pointerEvents="none">{highlightPaths}</G>
      )}
      {selectedPath && (
        <G pointerEvents="none">
          {selectedPath}
          {showPrefectureMarker && (
            <PrefectureMarker dept={selectedDept} strokeScale={markerScale} />
          )}
        </G>
      )}
    </Svg>
  ),
  (prev, next) =>
    prev.viewBox === next.viewBox &&
    prev.basePath === next.basePath &&
    prev.highlightPaths === next.highlightPaths &&
    prev.selectedPath === next.selectedPath &&
    prev.showPrefectureMarker === next.showPrefectureMarker &&
    prev.markerScale === next.markerScale &&
    prev.selectedDept === next.selectedDept
);

MapSvgContent.displayName = 'MapSvgContent';

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
    const [useDetailGeometry, setUseDetailGeometry] = useState(false);

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

    const basePath = useMemo(
      () => departments.map((dept) => dept.path).join(' '),
      [departments]
    );

    const scaleSV = useSharedValue(defaultCamera.scale);
    const focusXSV = useSharedValue(defaultCamera.focusX);
    const focusYSV = useSharedValue(defaultCamera.focusY);
    const layoutWidthSV = useSharedValue(0);
    const layoutHeightSV = useSharedValue(0);
    const gestureActiveSV = useSharedValue(0);
    const gestureStartScale = useSharedValue(1);
    const gestureStartFocusX = useSharedValue(0);
    const gestureStartFocusY = useSharedValue(0);
    const pinchAnchorX = useSharedValue(0);
    const pinchAnchorY = useSharedValue(0);
    const pinchAnchorReady = useSharedValue(0);

    if (!cameraRef.current) {
      cameraRef.current = defaultCamera;
    }

    const activeCamera = camera ?? defaultCamera;
    const isZoomed = activeCamera.scale > MIN_SCALE + ZOOM_EPSILON;

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

    const markGesturing = useCallback(() => {
      isGesturingRef.current = true;
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

    useEffect(() => {
      if (!isZoomed || isGesturingRef.current || isAnimatingRef.current) {
        setUseDetailGeometry(false);
        return undefined;
      }

      const timer = setTimeout(() => {
        setUseDetailGeometry(true);
      }, DETAIL_PATH_DELAY_MS);

      return () => clearTimeout(timer);
    }, [isZoomed, selectedCode, activeCamera.scale, activeCamera.focusX, activeCamera.focusY]);

    const animateCameraTo = useCallback(
      (next, onComplete) => {
        const clamped = clampCameraFocus(next, fullWidth, fullHeight);
        isAnimatingRef.current = true;
        gestureActiveSV.value = 1;
        setUseDetailGeometry(false);

        const timingConfig = {
          duration: ZOOM_ANIMATION_MS,
          easing: Easing.out(Easing.cubic),
        };

        const finish = () => {
          isAnimatingRef.current = false;
          gestureActiveSV.value = 0;
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
      [focusXSV, focusYSV, fullHeight, fullWidth, gestureActiveSV, scaleSV, setCamera]
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
      isGesturingRef.current = false;
      cameraRef.current = clamped;
      syncSharedCamera(clamped);
      setCameraState(clamped);
      gestureActiveSV.value = 0;

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
      gestureActiveSV,
      loadDetailPaths,
      notifyZoomChange,
      scaleSV,
      syncSharedCamera,
    ]);

    const handleMapTap = useCallback(
      (screenX, screenY) => {
        if (isGesturingRef.current || isAnimatingRef.current) {
          return;
        }

        const { width, height } = layoutRef.current;
        if (!width || !height) {
          return;
        }

        const mapPoint = screenPointToMap(
          screenX,
          screenY,
          cameraRef.current ?? defaultCamera,
          width,
          height,
          fullWidth,
          fullHeight
        );
        const code = findDepartmentAtMapPoint(departments, mapPoint.x, mapPoint.y);
        if (code) {
          onDepartmentPressRef.current?.(code);
        }
      },
      [defaultCamera, departments, fullHeight, fullWidth]
    );

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

    const animatedMapStyle = useAnimatedStyle(() => {
      const layoutWidth = layoutWidthSV.value;
      const layoutHeight = layoutHeightSV.value;
      if (layoutWidth <= 0 || layoutHeight <= 0) {
        return {};
      }

      const { translateX, translateY, scale } = cameraToViewStyleTransform(
        scaleSV.value,
        focusXSV.value,
        focusYSV.value,
        layoutWidth,
        layoutHeight,
        fullWidth,
        fullHeight
      );

      return {
        transform: [{ translateX }, { translateY }, { scale }],
      };
    });

    const animatedLabelStyle = useAnimatedStyle(() => ({
      opacity: gestureActiveSV.value > 0 ? 0 : 1,
    }));

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        gestureStartScale.value = scaleSV.value;
        gestureStartFocusX.value = focusXSV.value;
        gestureStartFocusY.value = focusYSV.value;
        pinchAnchorReady.value = 0;
        gestureActiveSV.value = 1;
        runOnJS(markGesturing)();
      })
      .onUpdate((event) => {
        const layoutWidth = layoutWidthSV.value;
        const layoutHeight = layoutHeightSV.value;
        if (layoutWidth <= 0 || layoutHeight <= 0) {
          return;
        }

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

        if (pinchAnchorReady.value === 0) {
          const anchor = screenPointToMapWorklet(
            event.focalX,
            event.focalY,
            gestureStartScale.value,
            gestureStartFocusX.value,
            gestureStartFocusY.value,
            layoutWidth,
            layoutHeight,
            fullWidth,
            fullHeight
          );
          pinchAnchorX.value = anchor.x;
          pinchAnchorY.value = anchor.y;
          pinchAnchorReady.value = 1;
        }

        const nextFocus = focusForMapPointAtScreenWorklet(
          event.focalX,
          event.focalY,
          pinchAnchorX.value,
          pinchAnchorY.value,
          nextScale,
          layoutWidth,
          layoutHeight,
          fullWidth,
          fullHeight
        );
        const clamped = clampCameraFocus(
          { scale: nextScale, focusX: nextFocus.focusX, focusY: nextFocus.focusY },
          fullWidth,
          fullHeight
        );

        scaleSV.value = clamped.scale;
        focusXSV.value = clamped.focusX;
        focusYSV.value = clamped.focusY;
      })
      .onEnd(() => {
        runOnJS(commitGestureCamera)();
      });

    const pan = Gesture.Pan()
      .maxPointers(1)
      .minDistance(8)
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
        gestureActiveSV.value = 1;
        runOnJS(markGesturing)();
      })
      .onUpdate((event) => {
        if (gestureStartScale.value <= MIN_SCALE) {
          return;
        }

        const layoutWidth = layoutWidthSV.value;
        const layoutHeight = layoutHeightSV.value;
        const { width: vbW, height: vbH } = viewBoxDimensionsForScale(
          gestureStartScale.value,
          fullWidth,
          fullHeight
        );
        const { renderWidth, renderHeight } = getRenderSize(
          layoutWidth,
          layoutHeight,
          fullWidth,
          fullHeight
        );

        const clamped = clampCameraFocus(
          {
            scale: gestureStartScale.value,
            focusX:
              gestureStartFocusX.value -
              (event.translationX * vbW) / Math.max(renderWidth, 1),
            focusY:
              gestureStartFocusY.value -
              (event.translationY * vbH) / Math.max(renderHeight, 1),
          },
          fullWidth,
          fullHeight
        );

        scaleSV.value = clamped.scale;
        focusXSV.value = clamped.focusX;
        focusYSV.value = clamped.focusY;
      })
      .onEnd(() => {
        runOnJS(commitGestureCamera)();
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd(() => {
        runOnJS(resetCamera)();
      });

    const singleTap = Gesture.Tap()
      .maxDuration(250)
      .onEnd((event) => {
        runOnJS(handleMapTap)(event.x, event.y);
      });

    const composed = Gesture.Simultaneous(
      Gesture.Exclusive(doubleTap, singleTap),
      Gesture.Simultaneous(pinch, pan)
    );

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

    const highlightPaths = useMemo(() => {
      if (highlightedSet.size === 0) {
        return [];
      }

      return departments
        .filter((dept) => highlightedSet.has(dept.code) && dept.code !== selectedCode)
        .map((dept) => (
          <Path
            key={`hl-${dept.code}`}
            d={dept.path}
            fill="#90CAF9"
            pointerEvents="none"
          />
        ));
    }, [departments, highlightedSet, selectedCode]);

    const selectedPath = useMemo(() => {
      if (!selectedDept) {
        return null;
      }

      const path =
        useDetailGeometry && detailPaths?.[selectedDept.code]
          ? detailPaths[selectedDept.code]
          : selectedDept.path;

      return (
        <Path
          key={`selected-${selectedDept.code}`}
          d={path}
          fill="#2196F3"
          pointerEvents="none"
        />
      );
    }, [detailPaths, selectedDept, useDetailGeometry]);

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
          <AnimatedMapLayer
            style={[styles.mapLayer, animatedMapStyle]}
            collapsable={false}
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
          >
            <MapSvgContent
              viewBox={fullViewBox}
              basePath={basePath}
              highlightPaths={highlightPaths}
              selectedPath={selectedPath}
              selectedDept={selectedDept}
              showPrefectureMarker={Boolean(selectedDept) && !isZoomed}
              markerScale={Math.max(activeCamera.scale, 1)}
            />
          </AnimatedMapLayer>
          {isZoomed && (
            <AnimatedLabelLayer
              pointerEvents="none"
              style={[styles.labelLayer, animatedLabelStyle]}
            >
              <PrefectureLabelOverlay
                name={prefectureName}
                position={prefectureLabelPosition}
              />
            </AnimatedLabelLayer>
          )}
        </View>
      </GestureDetector>
    );
  }
);

FranceMap.displayName = 'FranceMap';

const propsAreEqual = (prev, next) =>
  prev.selectedCode === next.selectedCode &&
  prev.highlightedCodes === next.highlightedCodes &&
  prev.style === next.style;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  mapLayer: {
    flex: 1,
  },
  labelLayer: {
    ...StyleSheet.absoluteFillObject,
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

export default memo(FranceMap, propsAreEqual);
