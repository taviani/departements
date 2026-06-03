export const MAX_MAP_SCALE = 20;
export const MIN_MAP_SCALE = 1;

export const parseViewBoxSize = (viewBox) => {
  const [, , width, height] = viewBox.split(' ').map(Number);
  return { width, height };
};

export const clamp = (value, min, max) => {
  'worklet';
  return Math.min(max, Math.max(min, value));
};

export const getRenderSize = (layoutWidth, layoutHeight, viewBoxWidth, viewBoxHeight) => {
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

export const clampViewBoxOrigin = (
  minX,
  minY,
  viewBoxWidth,
  viewBoxHeight,
  fullWidth,
  fullHeight
) => {
  'worklet';
  return {
    minX: clamp(minX, 0, fullWidth - viewBoxWidth),
    minY: clamp(minY, 0, fullHeight - viewBoxHeight),
  };
};

export const viewBoxDimensionsForScale = (scale, fullWidth, fullHeight) => {
  'worklet';
  return {
    width: fullWidth / scale,
    height: fullHeight / scale,
  };
};

export const viewBoxCenter = (minX, minY, viewBoxWidth, viewBoxHeight) => {
  'worklet';
  return {
    x: minX + viewBoxWidth / 2,
    y: minY + viewBoxHeight / 2,
  };
};

export const viewBoxOriginForCenter = (
  centerX,
  centerY,
  scale,
  fullWidth,
  fullHeight
) => {
  'worklet';
  const { width, height } = viewBoxDimensionsForScale(scale, fullWidth, fullHeight);
  return clampViewBoxOrigin(
    centerX - width / 2,
    centerY - height / 2,
    width,
    height,
    fullWidth,
    fullHeight
  );
};

export const svgPointToView = (
  cx,
  cy,
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
    x: offsetX + (cx / viewBoxWidth) * renderWidth,
    y: offsetY + (cy / viewBoxHeight) * renderHeight,
  };
};

export const computeTargetScale = (
  dept,
  layoutWidth,
  layoutHeight,
  viewBoxWidth,
  viewBoxHeight
) => {
  const { renderWidth, renderHeight } = getRenderSize(
    layoutWidth,
    layoutHeight,
    viewBoxWidth,
    viewBoxHeight
  );
  const deptWidth = (dept.bboxW / viewBoxWidth) * renderWidth;
  const deptHeight = (dept.bboxH / viewBoxHeight) * renderHeight;
  const fitScale =
    Math.min(layoutWidth / deptWidth, layoutHeight / deptHeight) * 0.75;
  return clamp(fitScale, 2.5, MAX_MAP_SCALE);
};

export const cameraToViewBoxString = (minX, minY, scale, fullWidth, fullHeight) => {
  const safeScale = Math.max(scale, MIN_MAP_SCALE);
  const width = fullWidth / safeScale;
  const height = fullHeight / safeScale;
  return `${minX} ${minY} ${width} ${height}`;
};

export const clampCamera = (camera, fullWidth, fullHeight) => {
  const scale = Math.max(camera.scale, MIN_MAP_SCALE);
  const { width, height } = viewBoxDimensionsForScale(scale, fullWidth, fullHeight);
  const { minX, minY } = clampViewBoxOrigin(
    camera.minX,
    camera.minY,
    width,
    height,
    fullWidth,
    fullHeight
  );
  return { scale, minX, minY };
};

export const createDefaultCamera = (fullWidth, fullHeight) => ({
  scale: 1,
  focusX: fullWidth / 2,
  focusY: fullHeight / 2,
});

export const clampCameraFocus = (camera, fullWidth, fullHeight) => {
  'worklet';
  const scale = Math.max(camera.scale, MIN_MAP_SCALE);
  const { width: vbW, height: vbH } = viewBoxDimensionsForScale(scale, fullWidth, fullHeight);
  return {
    scale,
    focusX: clamp(camera.focusX, vbW / 2, fullWidth - vbW / 2),
    focusY: clamp(camera.focusY, vbH / 2, fullHeight - vbH / 2),
  };
};

export const cameraToTransform = (camera, fullWidth, fullHeight) => {
  const scale = Math.max(camera.scale, MIN_MAP_SCALE);
  const centerX = fullWidth / 2;
  const centerY = fullHeight / 2;
  return `translate(${centerX} ${centerY}) scale(${scale}) translate(${-camera.focusX} ${-camera.focusY})`;
};

export const computeCameraForDepartment = (
  dept,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight,
  focusX = dept.cx,
  focusY = dept.cy
) => {
  let scale = computeTargetScale(
    dept,
    layoutWidth,
    layoutHeight,
    fullWidth,
    fullHeight
  );

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const { width: vbW, height: vbH } = viewBoxDimensionsForScale(scale, fullWidth, fullHeight);
    const fits =
      focusX - vbW / 2 >= 0 &&
      focusY - vbH / 2 >= 0 &&
      focusX + vbW / 2 <= fullWidth &&
      focusY + vbH / 2 <= fullHeight;

    if (fits || scale <= MIN_MAP_SCALE) {
      return clampCameraFocus({ scale, focusX, focusY }, fullWidth, fullHeight);
    }

    scale = Math.min(scale * 1.1, MAX_MAP_SCALE);
  }

  return clampCameraFocus({ scale, focusX, focusY }, fullWidth, fullHeight);
};

export const computeViewBoxForDepartment = (
  dept,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight,
  focusX = dept.cx,
  focusY = dept.cy
) => {
  let scale = computeTargetScale(
    dept,
    layoutWidth,
    layoutHeight,
    fullWidth,
    fullHeight
  );

  let width = fullWidth / scale;
  let height = fullHeight / scale;
  let minX = focusX - width / 2;
  let minY = focusY - height / 2;

  // When the ideal window crosses map edges, zoom out until the focus can sit centered.
  for (let attempt = 0; attempt < 24; attempt += 1) {
    width = fullWidth / scale;
    height = fullHeight / scale;
    minX = focusX - width / 2;
    minY = focusY - height / 2;

    const fits =
      minX >= 0 &&
      minY >= 0 &&
      minX + width <= fullWidth &&
      minY + height <= fullHeight;

    if (fits || scale <= MIN_MAP_SCALE) {
      return { scale, minX, minY, width, height };
    }

    scale = Math.min(scale * 1.1, MAX_MAP_SCALE);
  }

  const clamped = clampViewBoxOrigin(minX, minY, width, height, fullWidth, fullHeight);

  return { scale, minX: clamped.minX, minY: clamped.minY, width, height };
};

/** @deprecated Use computeViewBoxForDepartment — kept for tests during migration */
export const computeZoomTransform = (
  dept,
  layoutWidth,
  layoutHeight,
  viewBoxWidth,
  viewBoxHeight
) => {
  const { x, y } = svgPointToView(
    dept.cx,
    dept.cy,
    layoutWidth,
    layoutHeight,
    viewBoxWidth,
    viewBoxHeight
  );
  const targetScale = computeTargetScale(
    dept,
    layoutWidth,
    layoutHeight,
    viewBoxWidth,
    viewBoxHeight
  );
  const targetX = targetScale * (layoutWidth / 2 - x);
  const targetY = targetScale * (layoutHeight / 2 - y);
  return { targetScale, targetX, targetY };
};

export const computeStrokeWidth = (
  zoomScale,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight,
  screenPixels = 1
) => {
  const { width: viewBoxWidth, height: viewBoxHeight } = viewBoxDimensionsForScale(
    zoomScale,
    fullWidth,
    fullHeight
  );
  const { renderWidth } = getRenderSize(
    layoutWidth,
    layoutHeight,
    viewBoxWidth,
    viewBoxHeight
  );
  return (screenPixels * viewBoxWidth) / Math.max(renderWidth, 1);
};

/** Stroke width in map coords for paths inside a scaled `<G>` camera transform. */
export const computeTransformStrokeWidth = (
  scale,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight,
  screenPixels = 1.5
) => {
  const { renderWidth } = getRenderSize(
    layoutWidth,
    layoutHeight,
    fullWidth,
    fullHeight
  );
  const safeScale = Math.max(scale, MIN_MAP_SCALE);
  return (screenPixels * fullWidth) / (safeScale * Math.max(renderWidth, 1));
};

export const transformStrokeToScreenPixels = (
  strokeWidth,
  scale,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight
) => {
  const { renderWidth } = getRenderSize(
    layoutWidth,
    layoutHeight,
    fullWidth,
    fullHeight
  );
  const safeScale = Math.max(scale, MIN_MAP_SCALE);
  return (strokeWidth * safeScale * renderWidth) / fullWidth;
};
