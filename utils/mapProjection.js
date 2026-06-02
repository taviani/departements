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
