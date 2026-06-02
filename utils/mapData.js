import { gunzipSync, strFromU8 } from 'fflate';
import compressedMapData from '../data/departements-map.compressed.js';

let cachedMapData;

const fromTenths = (value) => value / 10;

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

const decodeBase64 = (value) => {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
};

const decodeMapData = () => {
  const binary = decodeBase64(compressedMapData);
  const json = strFromU8(gunzipSync(binary));
  const parsed = JSON.parse(json);

  return {
    viewBox: parsed.v,
    departments: parsed.d.map(expandDepartment),
  };
};

export const getMapData = () => {
  if (!cachedMapData) {
    cachedMapData = decodeMapData();
  }
  return cachedMapData;
};

export default getMapData;
