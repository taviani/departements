import React, { memo } from 'react';
import { Rect } from 'react-native-svg';

const HitTarget = memo(
  ({ dept, onPress }) => (
    <Rect
      x={dept.cx - dept.bboxW / 2}
      y={dept.cy - dept.bboxH / 2}
      width={dept.bboxW}
      height={dept.bboxH}
      fill="transparent"
      onPress={() => onPress(dept.code)}
    />
  ),
  (prev, next) => prev.dept.code === next.dept.code && prev.onPress === next.onPress
);

HitTarget.displayName = 'HitTarget';

export default HitTarget;
