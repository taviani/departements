import { gunzipSync, strFromU8 } from 'fflate';
import compressedDetailData from '../data/departements-map-detail.compressed.js';

let detailPathByCode;

const decodeBase64 = (value) => {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
};

const decodeDetailPaths = () => {
  const binary = decodeBase64(compressedDetailData);
  const json = strFromU8(gunzipSync(binary));
  const parsed = JSON.parse(json);

  return Object.fromEntries(parsed.d.map((dept) => [dept.c, dept.d]));
};

export const getDetailPaths = () => {
  if (!detailPathByCode) {
    detailPathByCode = decodeDetailPaths();
  }
  return detailPathByCode;
};

export default getDetailPaths;
