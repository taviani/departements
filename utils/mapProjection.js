import { getRenderSize } from './mapMath';

/** Project a map coordinate to screen pixels using the SVG camera transform. */
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

  const { renderWidth, renderHeight, offsetX, offsetY } = getRenderSize(
    layoutWidth,
    layoutHeight,
    fullWidth,
    fullHeight
  );

  return {
    x: offsetX + (viewBoxX / fullWidth) * renderWidth,
    y: offsetY + (viewBoxY / fullHeight) * renderHeight,
  };
};
