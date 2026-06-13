import { getRenderSize } from './mapMath';

const getRenderSizeWorklet = (
  layoutWidth,
  layoutHeight,
  viewBoxWidth,
  viewBoxHeight
) => {
  'worklet';
  const containerAspect = layoutWidth / layoutHeight;
  const viewAspect = viewBoxWidth / viewBoxHeight;

  if (containerAspect > viewAspect) {
    const renderHeight = layoutHeight;
    return {
      renderWidth: renderHeight * viewAspect,
      renderHeight,
      offsetX: (layoutWidth - renderHeight * viewAspect) / 2,
      offsetY: 0,
    };
  }

  const renderWidth = layoutWidth;
  return {
    renderWidth,
    renderHeight: renderWidth / viewAspect,
    offsetX: 0,
    offsetY: (layoutHeight - renderWidth / viewAspect) / 2,
  };
};

export const viewBoxPointToScreenWorklet = (
  pointX,
  pointY,
  viewBoxMinX,
  viewBoxMinY,
  viewBoxWidth,
  viewBoxHeight,
  layoutWidth,
  layoutHeight
) => {
  'worklet';
  const { renderWidth, renderHeight, offsetX, offsetY } = getRenderSizeWorklet(
    layoutWidth,
    layoutHeight,
    viewBoxWidth,
    viewBoxHeight
  );

  return {
    x: offsetX + ((pointX - viewBoxMinX) / viewBoxWidth) * renderWidth,
    y: offsetY + ((pointY - viewBoxMinY) / viewBoxHeight) * renderHeight,
  };
};

export const viewBoxPointToLocal = (
  viewBoxX,
  viewBoxY,
  layoutWidth,
  layoutHeight,
  viewBoxWidth,
  viewBoxHeight
) => {
  const { renderWidth, renderHeight, offsetX, offsetY } = getRenderSize(
    layoutWidth,
    layoutHeight,
    viewBoxWidth,
    viewBoxHeight
  );

  return {
    x: offsetX + ((viewBoxX / viewBoxWidth) * renderWidth),
    y: offsetY + ((viewBoxY / viewBoxHeight) * renderHeight),
  };
};

export const applyMapTransform = (
  localX,
  localY,
  layoutWidth,
  layoutHeight,
  scale,
  translateX,
  translateY
) => {
  const centerX = layoutWidth / 2;
  const centerY = layoutHeight / 2;

  return {
    x: centerX + scale * (localX - centerX) + translateX,
    y: centerY + scale * (localY - centerY) + translateY,
  };
};

export const viewBoxPointToScreen = (
  viewBoxX,
  viewBoxY,
  viewBoxMinX,
  viewBoxMinY,
  viewBoxWidth,
  viewBoxHeight,
  layoutWidth,
  layoutHeight
) => {
  return viewBoxPointToScreenWorklet(
    viewBoxX,
    viewBoxY,
    viewBoxMinX,
    viewBoxMinY,
    viewBoxWidth,
    viewBoxHeight,
    layoutWidth,
    layoutHeight
  );
};

/** Inverse of mapPointToScreen for tap handling. */
export const screenPointToMap = (
  screenX,
  screenY,
  camera,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight
) => {
  const scale = Math.max(camera.scale, 1);
  const { renderWidth, renderHeight, offsetX, offsetY } = getRenderSize(
    layoutWidth,
    layoutHeight,
    fullWidth,
    fullHeight
  );
  const viewBoxX = ((screenX - offsetX) / renderWidth) * fullWidth;
  const viewBoxY = ((screenY - offsetY) / renderHeight) * fullHeight;
  const centerX = fullWidth / 2;
  const centerY = fullHeight / 2;

  return {
    x: camera.focusX + (viewBoxX - centerX) / scale,
    y: camera.focusY + (viewBoxY - centerY) / scale,
  };
};

export const findDepartmentAtMapPoint = (departments, mapX, mapY) => {
  for (let index = departments.length - 1; index >= 0; index -= 1) {
    const dept = departments[index];
    const halfW = dept.bboxW / 2;
    const halfH = dept.bboxH / 2;

    if (
      mapX >= dept.cx - halfW &&
      mapX <= dept.cx + halfW &&
      mapY >= dept.cy - halfH &&
      mapY <= dept.cy + halfH
    ) {
      return dept.code;
    }
  }

  return null;
};

/** Project a map coordinate to screen pixels using the transform-based camera. */
export const mapPointToScreen = (
  mapX,
  mapY,
  camera,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight
) => {
  const scale = Math.max(camera.scale, 1);
  const centerX = fullWidth / 2;
  const centerY = fullHeight / 2;
  const viewBoxX = centerX + scale * (mapX - camera.focusX);
  const viewBoxY = centerY + scale * (mapY - camera.focusY);

  return viewBoxPointToScreen(
    viewBoxX,
    viewBoxY,
    0,
    0,
    fullWidth,
    fullHeight,
    layoutWidth,
    layoutHeight
  );
};
