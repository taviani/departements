import getMapData from '../../utils/mapData';
import {
  cameraToSvgMatrix,
  computeCameraForDepartment,
  createDefaultCamera,
  getRenderSize,
  MAX_MAP_SCALE,
  MIN_MAP_SCALE,
  parseViewBoxSize,
} from '../../utils/mapMath';
import { mapPointToScreen } from '../../utils/mapProjection';

const mapData = getMapData();
const { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT } = parseViewBoxSize(
  mapData.viewBox
);
const paris = mapData.departments.find((dept) => dept.code === '75');

describe('mapMath', () => {
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

  describe('cameraToSvgMatrix', () => {
    it('maps the map center to the viewport center at default scale', () => {
      const matrix = cameraToSvgMatrix(
        1,
        VIEWBOX_WIDTH / 2,
        VIEWBOX_HEIGHT / 2,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT
      );
      expect(matrix[0]).toBe(1);
      expect(matrix[3]).toBe(1);
      expect(matrix[4]).toBeCloseTo(0, 1);
      expect(matrix[5]).toBeCloseTo(0, 1);
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

      expect(camera.scale).toBeGreaterThan(MIN_MAP_SCALE);
      expect(camera.scale).toBeLessThanOrEqual(MAX_MAP_SCALE);
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
});
