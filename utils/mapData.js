import compressedMapData from '../data/departements-map.compressed.js';
import { decodeCompressedJson, fromTenths } from './compressedMapCodec';

let cachedMapData;

const expandDepartment = (dept) => ({
  code: dept.c,
  path: dept.d,
  cx: fromTenths(dept.x),
  cy: fromTenths(dept.y),
  bboxW: fromTenths(dept.w),
  bboxH: fromTenths(dept.h),
  prefectureX: dept.px == null ? null : fromTenths(dept.px),
  prefectureY: dept.py == null ? null : fromTenths(dept.py),
});

const decodeMapData = () => {
  const parsed = decodeCompressedJson(compressedMapData);

  return {
    viewBox: parsed.v,
    departments: parsed.d.map(expandDepartment),
    mergedBasePath: parsed.d.map((dept) => dept.d).join(' '),
  };
};

export const getMapData = () => {
  if (!cachedMapData) {
    cachedMapData = decodeMapData();
  }
  return cachedMapData;
};

export default getMapData;
