/**
 * Converts departements.geojson into a gzip-compressed SVG overview map.
 * Run: npm run build:map-data
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const INPUT = path.join(__dirname, '../data/departements.geojson');
const OUTPUT_OVERVIEW = path.join(
  __dirname,
  '../data/departements-map.compressed.js'
);
const GEOJSON_URL =
  'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson';
const WIDTH = 2000;
const HEIGHT = 2150;
const PADDING = 20;

const OVERVIEW_TOLERANCE = {
  dense: 0.06,
  medium: 0.1,
  simple: 0.16,
};

function extractCoords(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.flat();
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flat(2);
  }
  return [];
}

if (!fs.existsSync(INPUT)) {
  console.log('Downloading departements.geojson...');
  execSync(`curl -sL "${GEOJSON_URL}" -o "${INPUT}"`, { stdio: 'inherit' });
}

const geojson = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
const prefectures = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/prefectures.json'), 'utf8')
);

const fmt = (value) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const perpendicularDistance = (point, lineStart, lineEnd) => {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  return (
    Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / Math.hypot(dx, dy)
  );
};

const douglasPeucker = (points, tolerance) => {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[points.length - 1]];
};

let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

for (const feature of geojson.features) {
  for (const [lon, lat] of extractCoords(feature.geometry)) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
}

const project = (lon, lat) => [
  Math.round((PADDING + ((lon - minLon) / (maxLon - minLon)) * (WIDTH - 2 * PADDING)) * 10) /
    10,
  Math.round((PADDING + ((maxLat - lat) / (maxLat - minLat)) * (HEIGHT - 2 * PADDING)) * 10) /
    10,
];

const ringTolerance = (ring, profile) => {
  const projected = ring.map(([lon, lat]) => project(lon, lat));
  const perimeter = projected.reduce((sum, point, index) => {
    if (index === 0) {
      return 0;
    }
    const previous = projected[index - 1];
    return sum + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }, 0);
  const density = ring.length / Math.max(perimeter, 1);

  if (density > 0.8 || ring.length > 120) {
    return profile.dense;
  }
  if (density > 0.5 || ring.length > 60) {
    return profile.medium;
  }
  return profile.simple;
};

const ringToPath = (ring, profile) => {
  const tolerance = ringTolerance(ring, profile);
  const simplified = douglasPeucker(
    ring.map(([lon, lat]) => project(lon, lat)),
    tolerance
  );

  if (simplified.length < 3) {
    return { path: '', points: simplified };
  }

  let path = `M${fmt(simplified[0][0])},${fmt(simplified[0][1])}`;
  let previousX = simplified[0][0];
  let previousY = simplified[0][1];

  for (let i = 1; i < simplified.length; i += 1) {
    const deltaX = Math.round((simplified[i][0] - previousX) * 10) / 10;
    const deltaY = Math.round((simplified[i][1] - previousY) * 10) / 10;

    if (deltaX !== 0 || deltaY !== 0) {
      path += `l${fmt(deltaX)},${fmt(deltaY)}`;
      previousX = simplified[i][0];
      previousY = simplified[i][1];
    }
  }

  return { path: `${path}Z`, points: simplified };
};

const geometryToPath = (geometry, profile) => {
  const points = [];
  const segments = [];

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      const { path, points: ringPoints } = ringToPath(ring, profile);
      if (path) {
        segments.push(path);
        points.push(...ringPoints);
      }
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        const { path, points: ringPoints } = ringToPath(ring, profile);
        if (path) {
          segments.push(path);
          points.push(...ringPoints);
        }
      }
    }
  }

  return { path: segments.join(' '), points };
};

const toTenths = (value) => Math.round(value * 10);

const writeCompressedModule = (outputPath, payload) => {
  const compressed = zlib.gzipSync(payload, { level: 9 }).toString('base64');
  const fileContents = `// Generated by scripts/build-map-data.js — do not edit
export default '${compressed}';
`;
  fs.writeFileSync(outputPath, fileContents);
  return {
    rawKb: payload.length / 1024,
    gzipKb: zlib.gzipSync(payload, { level: 9 }).length / 1024,
    bundleKb: Buffer.byteLength(fileContents, 'utf8') / 1024,
  };
};

const overviewDepartments = [];

for (const feature of geojson.features) {
  const overview = geometryToPath(feature.geometry, OVERVIEW_TOLERANCE);
  const points = overview.points;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const prefecture = prefectures[feature.properties.code];
  const [prefectureX, prefectureY] = prefecture
    ? project(prefecture.lon, prefecture.lat)
    : [null, null];

  overviewDepartments.push({
    c: feature.properties.code,
    d: overview.path,
    x: toTenths((minX + maxX) / 2),
    y: toTenths((minY + maxY) / 2),
    w: toTenths(maxX - minX),
    h: toTenths(maxY - minY),
    px: prefectureX == null ? null : toTenths(prefectureX),
    py: prefectureY == null ? null : toTenths(prefectureY),
  });
}

const overviewPayload = JSON.stringify({
  v: `0 0 ${WIDTH} ${HEIGHT}`,
  d: overviewDepartments,
});

const overviewStats = writeCompressedModule(OUTPUT_OVERVIEW, overviewPayload);

console.log(`Wrote ${overviewDepartments.length} departments`);
console.log(
  `Overview: ${overviewStats.rawKb.toFixed(0)} KB raw, ${overviewStats.gzipKb.toFixed(0)} KB gzip, ${overviewStats.bundleKb.toFixed(0)} KB bundle`
);
