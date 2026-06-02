import getDetailPaths from '../../utils/mapDetailData';
import getMapData from '../../utils/mapData';

describe('mapDetailData', () => {
  it('provides detail paths for every overview department', () => {
    const overview = getMapData();
    const detailPaths = getDetailPaths();

    overview.departments.forEach((dept) => {
      expect(detailPaths[dept.code]).toMatch(/^M/);
      expect(detailPaths[dept.code].length).toBeGreaterThanOrEqual(dept.path.length);
    });
  });
});
