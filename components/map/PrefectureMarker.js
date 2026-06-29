import React, { memo } from 'react';
import { Circle, G } from 'react-native-svg';
import { PREFECTURE_MARKER } from '../../constants/mapTheme';

const PrefectureMarker = memo(({ dept }) => {
  if (dept.prefectureX == null || dept.prefectureY == null) {
    return null;
  }

  return (
    <G pointerEvents="none">
      <Circle
        cx={dept.prefectureX}
        cy={dept.prefectureY}
        r={4}
        fill={PREFECTURE_MARKER.fill}
        stroke={PREFECTURE_MARKER.stroke}
        strokeWidth={2}
      />
      <Circle
        cx={dept.prefectureX}
        cy={dept.prefectureY}
        r={2}
        fill={PREFECTURE_MARKER.inner}
      />
    </G>
  );
});

PrefectureMarker.displayName = 'PrefectureMarker';

export default PrefectureMarker;
