/* eslint-disable */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const boundaries = JSON.parse(
  fs.readFileSync(path.join(REPO, "src/shared/data/seoulDistrictBoundaries.json"), "utf8")
);

const GRS80_A = 6378137;
const GRS80_INV_F = 298.257222101;
const UTMK = {
  falseEasting: 1000000,
  falseNorthing: 2000000,
  lat0: 38,
  lon0: 127.5,
  k0: 0.9996,
};
const POINT_NUMBER_ORIGIN = { x: 700000, y: 1300000 };
const CELL_PX = 40;
const SIMPLIFY_TOLERANCE_PX = 0.6;
const RIVER_WIDTH_KM = 0.95;
const RIVER_NORTH_DISTRICTS = ["마포구", "용산구", "성동구", "광진구"];
const RIVER_SOUTH_DISTRICTS = [
  "강서구",
  "양천구",
  "영등포구",
  "동작구",
  "서초구",
  "강남구",
  "송파구",
  "강동구",
];
const RIVER_MATCH_METERS = 60;
const RIVER_BIN_COUNT = 150;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function projectToUtmk(lon, lat) {
  const f = 1 / GRS80_INV_F;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const phi = toRadians(lat);
  const lam = toRadians(lon);
  const lam0 = toRadians(UTMK.lon0);

  const n = GRS80_A / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const t = Math.tan(phi) ** 2;
  const c = ep2 * Math.cos(phi) ** 2;
  const a = (lam - lam0) * Math.cos(phi);

  const meridional = (degrees) => {
    const p = toRadians(degrees);
    return (
      GRS80_A *
      ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * p -
        ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * p) +
        ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * p) -
        ((35 * e2 ** 3) / 3072) * Math.sin(6 * p))
    );
  };

  const x =
    UTMK.falseEasting +
    UTMK.k0 *
      n *
      (a + ((1 - t + c) * a ** 3) / 6 + ((5 - 18 * t + t ** 2 + 72 * c - 58 * ep2) * a ** 5) / 120);
  const y =
    UTMK.falseNorthing +
    UTMK.k0 *
      (meridional(lat) -
        meridional(UTMK.lat0) +
        n *
          Math.tan(phi) *
          (a ** 2 / 2 +
            ((5 - t + 9 * c + 4 * c ** 2) * a ** 4) / 24 +
            ((61 - 58 * t + t ** 2 + 600 * c - 330 * ep2) * a ** 6) / 720));

  return { x, y };
}

function toGridKm(lon, lat) {
  const { x, y } = projectToUtmk(lon, lat);

  return { gx: (x - POINT_NUMBER_ORIGIN.x) / 1000, gy: (y - POINT_NUMBER_ORIGIN.y) / 1000 };
}

function eachRing(feature, visit) {
  const { type, coordinates } = feature.geometry;
  const polygons = type === "Polygon" ? [coordinates] : coordinates;

  polygons.forEach((polygon) => polygon.forEach(visit));
}

function simplifyRing(points, tolerance) {
  if (points.length < 4) {
    return points;
  }

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let maxDistance = 0;
    let index = -1;

    for (let i = first + 1; i < last; i += 1) {
      const distance = perpendicularDistance(points[i], points[first], points[last]);

      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    if (maxDistance > tolerance && index > 0) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, index) => keep[index] === 1);
}

function perpendicularDistance([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function collectVertices(names) {
  const points = [];
  boundaries.features
    .filter((feature) => names.includes(feature.properties.name))
    .forEach((feature) => eachRing(feature, (ring) => ring.forEach((point) => points.push(point))));

  return points;
}

function metersBetween([lonA, latA], [lonB, latB]) {
  return Math.hypot((lonA - lonB) * 88200, (latA - latB) * 111000);
}

function buildRiverCenterline() {
  const northPoints = collectVertices(RIVER_NORTH_DISTRICTS);
  const southPoints = collectVertices(RIVER_SOUTH_DISTRICTS);
  const southByLon = new Map();

  southPoints.forEach((point) => {
    const bucket = Math.round(point[0] * 1000);
    for (let offset = -1; offset <= 1; offset += 1) {
      const list = southByLon.get(bucket + offset) ?? [];
      list.push(point);
      southByLon.set(bucket + offset, list);
    }
  });

  const shared = northPoints.filter((point) =>
    (southByLon.get(Math.round(point[0] * 1000)) ?? []).some(
      (other) => metersBetween(point, other) <= RIVER_MATCH_METERS
    )
  );

  const minLon = Math.min(...shared.map((point) => point[0]));
  const maxLon = Math.max(...shared.map((point) => point[0]));
  const bins = Array.from({ length: RIVER_BIN_COUNT }, () => []);

  shared.forEach((point) => {
    const ratio = (point[0] - minLon) / (maxLon - minLon);
    bins[Math.min(Math.floor(ratio * RIVER_BIN_COUNT), RIVER_BIN_COUNT - 1)].push(point[1]);
  });

  const centerline = bins
    .map((lats, index) => {
      if (lats.length === 0) {
        return null;
      }

      const sorted = [...lats].sort((a, b) => a - b);

      return [
        minLon + ((index + 0.5) / RIVER_BIN_COUNT) * (maxLon - minLon),
        sorted[Math.floor(sorted.length / 2)],
      ];
    })
    .filter(Boolean);

  return { centerline: extendEnds(centerline), sharedCount: shared.length };
}

function extendEnds(line, spanPoints = 4, extendDegrees = 0.09) {
  const extend = (from, toward) => {
    const dx = from[0] - toward[0];
    const dy = from[1] - toward[1];
    const length = Math.hypot(dx, dy);

    return [from[0] + (dx / length) * extendDegrees, from[1] + (dy / length) * extendDegrees];
  };

  return [
    extend(line[0], line[spanPoints]),
    ...line,
    extend(line[line.length - 1], line[line.length - 1 - spanPoints]),
  ];
}

const districtRings = [];
boundaries.features.forEach((feature) =>
  eachRing(feature, (ring) => districtRings.push(ring.map(([lon, lat]) => toGridKm(lon, lat))))
);

const river = buildRiverCenterline();

let minGx = Infinity;
let maxGx = -Infinity;
let minGy = Infinity;
let maxGy = -Infinity;

districtRings.forEach((ring) =>
  ring.forEach(({ gx, gy }) => {
    minGx = Math.min(minGx, gx);
    maxGx = Math.max(maxGx, gx);
    minGy = Math.min(minGy, gy);
    maxGy = Math.max(maxGy, gy);
  })
);

const cellMinX = Math.floor(minGx);
const cellMaxX = Math.ceil(maxGx);
const cellMinY = Math.floor(minGy);
const cellMaxY = Math.ceil(maxGy);
const columns = cellMaxX - cellMinX;
const rows = cellMaxY - cellMinY;
const width = columns * CELL_PX;
const height = rows * CELL_PX;

const toSvgX = (gx) => (gx - cellMinX) * CELL_PX;
const toSvgY = (gy) => (cellMaxY - gy) * CELL_PX;

const originalVertexCount = districtRings.reduce((sum, ring) => sum + ring.length, 0);
const simplifiedRings = districtRings.map((ring) =>
  simplifyRing(
    ring.map(({ gx, gy }) => [toSvgX(gx), toSvgY(gy)]),
    SIMPLIFY_TOLERANCE_PX
  )
);
const simplifiedVertexCount = simplifiedRings.reduce((sum, ring) => sum + ring.length, 0);

const landPathData = simplifiedRings
  .map((ring) => `M${ring.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`)
  .join("");

const riverPathData = river.centerline
  .map(([lon, lat], index) => {
    const { gx, gy } = toGridKm(lon, lat);

    return `${index === 0 ? "M" : "L"}${toSvgX(gx).toFixed(1)},${toSvgY(gy).toFixed(1)}`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="grid" patternUnits="userSpaceOnUse" width="${CELL_PX}" height="${CELL_PX}">
      <rect width="${CELL_PX}" height="${CELL_PX}" fill="#f4e7c8" />
      <path d="M${CELL_PX} 0V${CELL_PX}H0" fill="none" stroke="#a89263" stroke-width="1" opacity="0.75" />
    </pattern>
    <clipPath id="land">
      <path d="${landPathData}" />
    </clipPath>
  </defs>
  <path d="${landPathData}" fill="none" stroke="#cbb489" stroke-width="4" stroke-linejoin="round" />
  <path d="${landPathData}" fill="url(#grid)" />
  <path d="${riverPathData}" clip-path="url(#land)" fill="none" stroke="#4cc3f5" stroke-width="${(RIVER_WIDTH_KM * CELL_PX).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

const outPath = path.join(REPO, "src/assets/entry-exploration/seoul-grid-map.svg");
fs.writeFileSync(outPath, svg);

const CELL_COVERAGE_THRESHOLD = 0.7;
const CELL_SUBSAMPLES = 10;

const landPolygons = [];
boundaries.features.forEach((feature) => {
  const list =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;

  list.forEach((rings) => {
    const projected = rings.map((ring) =>
      ring.map(([lon, lat]) => {
        const { gx, gy } = toGridKm(lon, lat);

        return [gx, gy];
      })
    );
    const outer = projected[0];

    landPolygons.push({
      bbox: [
        Math.min(...outer.map(([x]) => x)),
        Math.min(...outer.map(([, y]) => y)),
        Math.max(...outer.map(([x]) => x)),
        Math.max(...outer.map(([, y]) => y)),
      ],
      name: feature.properties.name,
      rings: projected,
    });
  });
});

function isPointInRing(x, y, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

function findLandDistrict(x, y) {
  return landPolygons.find(({ bbox, rings }) => {
    if (x < bbox[0] || x > bbox[2] || y < bbox[1] || y > bbox[3]) {
      return false;
    }

    if (!isPointInRing(x, y, rings[0])) {
      return false;
    }

    return !rings.slice(1).some((hole) => isPointInRing(x, y, hole));
  })?.name;
}

function measureCell(eastKm, northKm) {
  const districtHits = new Map();
  let hits = 0;

  for (let sy = 0; sy < CELL_SUBSAMPLES; sy += 1) {
    for (let sx = 0; sx < CELL_SUBSAMPLES; sx += 1) {
      const district = findLandDistrict(
        eastKm + (sx + 0.5) / CELL_SUBSAMPLES,
        northKm + (sy + 0.5) / CELL_SUBSAMPLES
      );

      if (!district) {
        continue;
      }

      hits += 1;
      districtHits.set(district, (districtHits.get(district) ?? 0) + 1);
    }
  }

  const dominant = [...districtHits.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    coverage: hits / (CELL_SUBSAMPLES * CELL_SUBSAMPLES),
    district: dominant ? dominant[0] : null,
  };
}

const measuredCells = Array.from({ length: rows }, (_, row) =>
  Array.from({ length: columns }, (_, column) =>
    measureCell(cellMinX + column, cellMinY + (rows - 1 - row))
  )
);
const districtNames = [
  ...new Set(
    measuredCells
      .flat()
      .filter((cell) => cell.coverage >= CELL_COVERAGE_THRESHOLD && cell.district)
      .map((cell) => cell.district)
  ),
].sort();
const districtCellRows = measuredCells.map((cells) =>
  cells
    .map((cell) =>
      cell.coverage >= CELL_COVERAGE_THRESHOLD && cell.district
        ? districtNames.indexOf(cell.district).toString(36)
        : "-"
    )
    .join("")
);
const validCellCount = districtCellRows
  .join("")
  .split("")
  .filter((code) => code !== "-").length;

fs.writeFileSync(
  path.join(REPO, "src/features/entry-exploration/config/seoulGridCells.json"),
  `${JSON.stringify(
    {
      columns,
      coverageThreshold: CELL_COVERAGE_THRESHOLD,
      originKm: { x: cellMinX, y: cellMinY },
      districtCellRows,
      districtNames,
      rows,
    },
    null,
    2
  )}\n`
);

console.log(
  JSON.stringify(
    {
      gridBounds: { cellMinX, cellMaxX, cellMinY, cellMaxY },
      columns,
      rows,
      imageSize: { width, height },
      vertices: { original: originalVertexCount, simplified: simplifiedVertexCount },
      riverSharedVertices: river.sharedCount,
      validCellCount,
      districtCount: districtNames.length,
      bytes: Buffer.byteLength(svg),
    },
    null,
    2
  )
);
