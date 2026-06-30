import { decodeCompressedJson } from './compressedMapCodec';
import locationCompressed from '../data/departements-location.compressed';

let cachedDepartments = null;

export const loadLocationDepartments = () => {
  if (cachedDepartments) {
    return cachedDepartments;
  }

  const payload = decodeCompressedJson(locationCompressed);
  cachedDepartments = payload.d.map((entry) => ({
    code: entry.c,
    rings: entry.r,
  }));
  return cachedDepartments;
};
