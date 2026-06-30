import { loadLocationDepartments } from './locationData';

const pointInRing = (lon, lat, ring) => {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const pointInRings = (lon, lat, rings) => {
  if (!rings.length) {
    return false;
  }

  if (!pointInRing(lon, lat, rings[0])) {
    return false;
  }

  for (let index = 1; index < rings.length; index += 1) {
    if (pointInRing(lon, lat, rings[index])) {
      return false;
    }
  }

  return true;
};

export const findDepartementCodeAtCoordinate = (latitude, longitude, departments) => {
  const lon = longitude;
  const lat = latitude;

  for (const department of departments) {
    if (pointInRings(lon, lat, department.rings)) {
      return department.code;
    }
  }

  return null;
};

export const findDepartementCodeAt = (latitude, longitude) => {
  if (latitude == null || longitude == null) {
    return null;
  }

  return findDepartementCodeAtCoordinate(
    latitude,
    longitude,
    loadLocationDepartments()
  );
};
