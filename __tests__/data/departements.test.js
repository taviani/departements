import { departements } from '../../data/departements';
import getMapData from '../../utils/mapData';
import prefectures from '../../data/prefectures.json';

const METRO_DEPARTEMENTS = departements.filter(
  (dept) => !['971', '972', '973', '974', '976'].includes(dept.number)
);

describe('departements data integrity', () => {
  it('contains 101 French departments', () => {
    expect(departements).toHaveLength(101);
  });

  it('has unique department numbers', () => {
    const numbers = departements.map((dept) => dept.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('requires number, name, and region on every entry', () => {
    departements.forEach((dept) => {
      expect(dept.number).toEqual(expect.any(String));
      expect(dept.name.length).toBeGreaterThan(0);
      expect(dept.region.length).toBeGreaterThan(0);
    });
  });

  it('includes Corsica departments 2A and 2B', () => {
    const numbers = departements.map((dept) => dept.number);
    expect(numbers).toContain('2A');
    expect(numbers).toContain('2B');
  });

  it('includes overseas departments', () => {
    const overseas = ['971', '972', '973', '974', '976'];
    overseas.forEach((number) => {
      expect(departements.some((dept) => dept.number === number)).toBe(true);
    });
  });
});

describe('map data integrity', () => {
  const mapData = getMapData();

  it('has a valid viewBox', () => {
    expect(mapData.viewBox).toMatch(/^\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/);
  });

  it('covers all 96 metropolitan departments on the map', () => {
    expect(mapData.departments).toHaveLength(96);
  });

  it('maps every metro department number from the list', () => {
    const mapCodes = new Set(mapData.departments.map((dept) => dept.code));
    METRO_DEPARTEMENTS.forEach((dept) => {
      expect(mapCodes.has(dept.number)).toBe(true);
    });
  });

  it('does not include overseas departments on the metro map', () => {
    const overseas = ['971', '972', '973', '974', '976'];
    const mapCodes = mapData.departments.map((dept) => dept.code);
    overseas.forEach((code) => {
      expect(mapCodes).not.toContain(code);
    });
  });

  it('provides geometry and centroid for each map department', () => {
    mapData.departments.forEach((dept) => {
      expect(dept.path).toMatch(/^M/);
      expect(dept.cx).toEqual(expect.any(Number));
      expect(dept.cy).toEqual(expect.any(Number));
      expect(dept.bboxW).toBeGreaterThan(0);
      expect(dept.bboxH).toBeGreaterThan(0);
    });
  });

  it('matches department names between list and map data', () => {
    const listByNumber = Object.fromEntries(
      METRO_DEPARTEMENTS.map((dept) => [dept.number, dept.name])
    );

    mapData.departments.forEach((dept) => {
      expect(listByNumber[dept.code]).toBeDefined();
    });
  });
});

describe('prefecture data integrity', () => {
  const mapData = getMapData();

  it('has prefecture entries for metropolitan departments', () => {
    METRO_DEPARTEMENTS.forEach((dept) => {
      expect(prefectures[dept.number]).toBeDefined();
      expect(prefectures[dept.number].name.length).toBeGreaterThan(0);
    });
  });

  it('stores valid coordinates for map prefectures', () => {
    mapData.departments.forEach((dept) => {
      expect(dept.prefectureX).toEqual(expect.any(Number));
      expect(dept.prefectureY).toEqual(expect.any(Number));
    });
  });
});
