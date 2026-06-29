export const MAX_MAP_SCALE = 20;
export const MIN_MAP_SCALE = 1;

export const parseViewBoxSize = (viewBox) => {
  const [, , width, height] = viewBox.split(' ').map(Number);
  return { width, height };
};

const clamp = (value, min, max) => {
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

const viewBoxDimensionsForScale = (scale, fullWidth, fullHeight) => ({
  width: fullWidth / scale,
  height: fullHeight / scale,
});

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

/** SVG `matrix` attribute for AnimatedG camera. */
export const cameraToSvgMatrix = (scale, focusX, focusY, fullWidth, fullHeight) => {
  'worklet';
  const safeScale = Math.max(scale, MIN_MAP_SCALE);
  const centerX = fullWidth / 2;
  const centerY = fullHeight / 2;
  return [
    safeScale,
    0,
    0,
    safeScale,
    centerX - safeScale * focusX,
    centerY - safeScale * focusY,
  ];
};

const computeTargetScale = (
  dept,
  layoutWidth,
  layoutHeight,
  viewBoxWidth,
  viewBoxHeight,
  fitRatio = 0.75
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
    Math.min(layoutWidth / deptWidth, layoutHeight / deptHeight) * fitRatio;
  return clamp(fitScale, 2.5, MAX_MAP_SCALE);
};

export const computeCameraForDepartment = (
  dept,
  layoutWidth,
  layoutHeight,
  fullWidth,
  fullHeight,
  focusX = dept.cx,
  focusY = dept.cy,
  fitRatio = 0.75
) => {
  let scale = computeTargetScale(
    dept,
    layoutWidth,
    layoutHeight,
    fullWidth,
    fullHeight,
    fitRatio
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
