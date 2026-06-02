import getMapData from '../../utils/mapData';
import {
  clamp,
  clampCamera,
  cameraToViewBoxString,
  computeCameraForDepartment,
  computeStrokeWidth,
  computeTransformStrokeWidth,
  computeTargetScale,
  computeViewBoxForDepartment,
  computeZoomTransform,
  createDefaultCamera,
  getRenderSize,
  MAX_MAP_SCALE,
  MIN_MAP_SCALE,
  parseViewBoxSize,
  svgPointToView,
  transformStrokeToScreenPixels,
} from '../../utils/mapMath';
import { mapPointToScreen } from '../../utils/mapProjection';

const mapData = getMapData();
const { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT } = parseViewBoxSize(
  mapData.viewBox
);
const paris = mapData.departments.find((dept) => dept.code === '75');

describe('mapMath', () => {
  describe('clamp', () => {
    it('keeps values within bounds', () => {
      expect(clamp(5, MIN_MAP_SCALE, MAX_MAP_SCALE)).toBe(5);
      expect(clamp(0, MIN_MAP_SCALE, MAX_MAP_SCALE)).toBe(MIN_MAP_SCALE);
      expect(clamp(99, MIN_MAP_SCALE, MAX_MAP_SCALE)).toBe(MAX_MAP_SCALE);
    });

    it('allows zoom up to 20x', () => {
      expect(MAX_MAP_SCALE).toBe(20);
    });
  });

  describe('getRenderSize', () => {
    it('letterboxes wide containers', () => {
      const size = getRenderSize(400, 200, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
      expect(size.offsetY).toBe(0);
      expect(size.renderWidth).toBeLessThan(400);
      expect(size.offsetX).toBeGreaterThan(0);
    });

    it('letterboxes tall containers', () => {
      const size = getRenderSize(200, 400, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
      expect(size.offsetX).toBe(0);
      expect(size.renderHeight).toBeLessThan(400);
      expect(size.offsetY).toBeGreaterThan(0);
    });
  });

  describe('svgPointToView', () => {
    it('maps viewBox coordinates into layout space', () => {
      const point = svgPointToView(
        VIEWBOX_WIDTH / 2,
        VIEWBOX_HEIGHT / 2,
        300,
        300,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      expect(point.x).toBeCloseTo(150, 0);
      expect(point.y).toBeCloseTo(150, 0);
    });
  });

  describe('computeTargetScale', () => {
    it('returns a scale between 2.5 and 12 for Paris', () => {
      const scale = computeTargetScale(
        paris,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      expect(scale).toBeGreaterThanOrEqual(2.5);
      expect(scale).toBeLessThanOrEqual(MAX_MAP_SCALE);
    });
  });

describe('computeViewBoxForDepartment', () => {
    it('centers the department bbox in the viewport', () => {
      const camera = computeViewBoxForDepartment(
        paris,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      const { renderWidth, renderHeight, offsetX, offsetY } = getRenderSize(
        320,
        280,
        camera.width,
        camera.height
      );
      const screenX =
        offsetX + ((paris.cx - camera.minX) / camera.width) * renderWidth;
      const screenY =
        offsetY + ((paris.cy - camera.minY) / camera.height) * renderHeight;

      expect(camera.scale).toBeGreaterThan(1);
      expect(screenX).toBeCloseTo(160, 0);
      expect(screenY).toBeCloseTo(140, 0);
    });

    it('centers edge departments after adjusting scale', () => {
      const nord = mapData.departments.find((dept) => dept.code === '59');
      const camera = computeViewBoxForDepartment(
        nord,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      const { renderWidth, renderHeight, offsetX, offsetY } = getRenderSize(
        320,
        280,
        camera.width,
        camera.height
      );
      const screenX =
        offsetX + ((nord.cx - camera.minX) / camera.width) * renderWidth;
      const screenY =
        offsetY + ((nord.cy - camera.minY) / camera.height) * renderHeight;

      expect(screenX).toBeCloseTo(160, 0);
      expect(screenY).toBeCloseTo(140, 0);
    });
  });

  describe('computeCameraForDepartment', () => {
    it('centers the department on screen via transform camera', () => {
      const camera = computeCameraForDepartment(
        paris,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      const point = mapPointToScreen(
        paris.cx,
        paris.cy,
        camera,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );

      expect(point.x).toBeCloseTo(160, 0);
      expect(point.y).toBeCloseTo(140, 0);
    });

    it('keeps prefecture inside projected screen bounds for Marseille', () => {
      const marseille = mapData.departments.find((dept) => dept.code === '13');
      const camera = computeCameraForDepartment(
        marseille,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      const deptCenter = mapPointToScreen(
        marseille.cx,
        marseille.cy,
        camera,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      const prefecture = mapPointToScreen(
        marseille.prefectureX,
        marseille.prefectureY,
        camera,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );

      expect(deptCenter.x).toBeCloseTo(160, 0);
      expect(deptCenter.y).toBeCloseTo(140, 0);
      expect(Math.abs(prefecture.x - deptCenter.x)).toBeLessThan(80);
      expect(Math.abs(prefecture.y - deptCenter.y)).toBeLessThan(80);
    });

    it('returns map center at default scale', () => {
      const camera = createDefaultCamera(VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
      const point = mapPointToScreen(
        VIEWBOX_WIDTH / 2,
        VIEWBOX_HEIGHT / 2,
        camera,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );

      expect(point.x).toBeCloseTo(160, 0);
      expect(point.y).toBeCloseTo(140, 0);
    });
  });

  describe('computeTransformStrokeWidth', () => {
    it('keeps roughly constant screen width at any zoom level', () => {
      const layout = { width: 320, height: 280 };
      const scales = [1, 3, 10, 20];

      scales.forEach((scale) => {
        const stroke = computeTransformStrokeWidth(
          scale,
          layout.width,
          layout.height,
          VIEWBOX_WIDTH,
          VIEWBOX_HEIGHT,
          1.5
        );
        const onScreen = transformStrokeToScreenPixels(
          stroke,
          scale,
          layout.width,
          layout.height,
          VIEWBOX_WIDTH,
          VIEWBOX_HEIGHT
        );
        expect(onScreen).toBeCloseTo(1.5, 1);
      });
    });
  });

  describe('computeStrokeWidth', () => {
    it('uses thinner viewBox units when zoomed out', () => {
      const zoomedOut = computeStrokeWidth(
        1,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      const zoomedIn = computeStrokeWidth(
        10,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      expect(zoomedIn).toBeLessThan(zoomedOut);
    });
  });

  describe('computeZoomTransform', () => {
    it('centers the department in the viewport', () => {
      const { targetScale, targetX, targetY } = computeZoomTransform(
        paris,
        320,
        280,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );

      expect(targetScale).toBeGreaterThan(1);
      expect(Number.isFinite(targetX)).toBe(true);
      expect(Number.isFinite(targetY)).toBe(true);
    });

    it('produces finite values for every map department', () => {
      mapData.departments.forEach((dept) => {
        const transform = computeZoomTransform(
          dept,
          320,
          280,
          VIEWBOX_WIDTH,
          VIEWBOX_HEIGHT
        );
        expect(transform.targetScale).toBeGreaterThanOrEqual(2.5);
        expect(transform.targetScale).toBeLessThanOrEqual(MAX_MAP_SCALE);
        expect(Number.isFinite(transform.targetX)).toBe(true);
        expect(Number.isFinite(transform.targetY)).toBe(true);
      });
    });
  });
});
