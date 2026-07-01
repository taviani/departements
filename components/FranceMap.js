import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { MAP_FILL } from '../constants/mapTheme';
import { getPrefectureName } from '../data/prefectures';
import { useMapCamera } from '../hooks/useMapCamera';
import getMapData from '../utils/mapData';
import { parseViewBoxSize } from '../utils/mapMath';
import { mapPointToScreen } from '../utils/mapProjection';
import HitTarget from './map/HitTarget';
import PrefectureLabelOverlay from './map/PrefectureLabelOverlay';
import PrefectureMarker from './map/PrefectureMarker';
import { styles } from '../styles/FranceMapStyles';

Animated.addWhitelistedNativeProps({ matrix: true });

const AnimatedG = Animated.createAnimatedComponent(G);

function FranceMap({
  selectedCode,
  highlightedCodes,
  detailCode,
  visitIntensityByCode,
  onDepartmentPress,
  onZoomChange,
  style,
}) {
  const mapData = useMemo(() => getMapData(), []);
  const departments = mapData.departments;
  const basePath = mapData.mergedBasePath;
  const fullViewBox = mapData.viewBox;
  const { width: fullWidth, height: fullHeight } = useMemo(
    () => parseViewBoxSize(fullViewBox),
    [fullViewBox]
  );

  const {
    activeCamera,
    isZoomed,
    layoutSize,
    handleLayout,
    guardPress,
    animatedGroupProps,
  } = useMapCamera({
    departments,
    fullWidth,
    fullHeight,
    zoomedCode: detailCode,
    onZoomChange,
  });

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

  const handleDepartmentPress = useCallback(
    (code) => {
      guardPress(() => onDepartmentPress?.(code));
    },
    [guardPress, onDepartmentPress]
  );

  const highlightPath = useMemo(() => {
    if (highlightedSet.size === 0) {
      return null;
    }

    const merged = departments
      .filter((dept) => highlightedSet.has(dept.code) && dept.code !== selectedCode)
      .map((dept) => dept.path)
      .join(' ');

    return merged ? <Path d={merged} fill={MAP_FILL.highlight} /> : null;
  }, [departments, highlightedSet, selectedCode]);

  const selectedPath = useMemo(() => {
    if (!selectedDept) {
      return null;
    }
    return <Path d={selectedDept.path} fill={MAP_FILL.selected} />;
  }, [selectedDept]);

  const visitedPaths = useMemo(() => {
    if (!visitIntensityByCode || Object.keys(visitIntensityByCode).length === 0) {
      return null;
    }

    return departments
      .filter(
        (dept) =>
          visitIntensityByCode[dept.code] > 0 &&
          dept.code !== selectedCode &&
          !highlightedSet.has(dept.code)
      )
      .map((dept) => {
        const level = visitIntensityByCode[dept.code];
        return (
          <Path
            key={`visit-${dept.code}`}
            d={dept.path}
            fill={MAP_FILL.visited[level] ?? MAP_FILL.default}
          />
        );
      });
  }, [departments, highlightedSet, selectedCode, visitIntensityByCode]);

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

  const hitTargets = useMemo(
    () =>
      departments.map((dept) => (
        <HitTarget
          key={`hit-${dept.code}`}
          dept={dept}
          onPress={handleDepartmentPress}
        />
      )),
    [departments, handleDepartmentPress]
  );

  return (
    <View
      style={[styles.wrapper, style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        handleLayout(width, height);
      }}
    >
      <Svg
        viewBox={fullViewBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={styles.svg}
      >
        <AnimatedG animatedProps={animatedGroupProps}>
          <G pointerEvents="none">
            <Path d={basePath} fill={MAP_FILL.default} />
            {visitedPaths}
            {highlightPath}
            {selectedPath}
            {selectedDept && !isZoomed ? (
              <PrefectureMarker dept={selectedDept} />
            ) : null}
          </G>
          {hitTargets}
        </AnimatedG>
      </Svg>
      {isZoomed ? (
        <PrefectureLabelOverlay
          name={prefectureName}
          position={prefectureLabelPosition}
        />
      ) : null}
    </View>
  );
}

const propsAreEqual = (prev, next) =>
  prev.selectedCode === next.selectedCode &&
  prev.detailCode === next.detailCode &&
  prev.highlightedCodes === next.highlightedCodes &&
  prev.visitIntensityByCode === next.visitIntensityByCode &&
  prev.style === next.style;

export default memo(FranceMap, propsAreEqual);
