import { gunzipSync, strFromU8 } from 'fflate';

export const fromTenths = (value) => value / 10;

export const decodeBase64 = (value) => {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
};

export const decodeCompressedJson = (compressedBase64) => {
  const binary = decodeBase64(compressedBase64);
  const json = strFromU8(gunzipSync(binary));
  return JSON.parse(json);
};
