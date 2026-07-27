export type EntryExplorationDistrictMapSize = {
  depth: number;
  width: number;
};

export type EntryExplorationDistrictSelectionPoint = {
  x: number;
  y: number;
};

export type EntryExplorationDistrictSelectionVector = EntryExplorationDistrictSelectionPoint;

export type EntryExplorationDistrictSelectionLandingInput = {
  chargeDurationMs: number;
  chargeMaxDurationMs: number;
  direction: EntryExplorationDistrictSelectionVector;
  maxDistance: number;
  minDistance: number;
  startPoint: EntryExplorationDistrictSelectionPoint;
};

export type EntryExplorationDistrictBoundaryPosition = readonly [number, number];
export type EntryExplorationDistrictBoundaryRing =
  readonly EntryExplorationDistrictBoundaryPosition[];
export type EntryExplorationDistrictBoundaryPolygon =
  readonly EntryExplorationDistrictBoundaryRing[];

export type EntryExplorationDistrictBoundaryGeometry =
  | {
      coordinates: EntryExplorationDistrictBoundaryPolygon;
      type: "Polygon";
    }
  | {
      coordinates: readonly EntryExplorationDistrictBoundaryPolygon[];
      type: "MultiPolygon";
    };

export type EntryExplorationDistrictBoundaryFeature = {
  geometry: EntryExplorationDistrictBoundaryGeometry;
  properties: {
    districtId: number;
    name: string;
  };
  type: "Feature";
};

export type EntryExplorationProjectedDistrictPolygon = {
  rings: readonly (readonly EntryExplorationDistrictSelectionPoint[])[];
};

export type EntryExplorationProjectedDistrict = {
  districtId: number;
  name: string;
  polygons: readonly EntryExplorationProjectedDistrictPolygon[];
};

export type ProjectEntryExplorationDistrictBoundariesInput = {
  boundaries: readonly EntryExplorationDistrictBoundaryFeature[];
  mapSize: EntryExplorationDistrictMapSize;
  padding: number;
};

type EntryExplorationLngLatBounds = {
  maxLat: number;
  maxLng: number;
  minLat: number;
  minLng: number;
};

const DEFAULT_SELECTION_DIRECTION = {
  x: 0,
  y: 1,
} as const satisfies EntryExplorationDistrictSelectionVector;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getBoundaryPolygons(
  geometry: EntryExplorationDistrictBoundaryGeometry
): readonly EntryExplorationDistrictBoundaryPolygon[] {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  return geometry.coordinates;
}

function getBoundaryPositions(
  boundaries: readonly EntryExplorationDistrictBoundaryFeature[]
): EntryExplorationDistrictBoundaryPosition[] {
  return boundaries.flatMap((boundary) =>
    getBoundaryPolygons(boundary.geometry).flatMap((polygon) => polygon.flatMap((ring) => ring))
  );
}

function getLngLatBounds(
  boundaries: readonly EntryExplorationDistrictBoundaryFeature[]
): EntryExplorationLngLatBounds | null {
  const positions = getBoundaryPositions(boundaries);

  if (positions.length === 0) {
    return null;
  }

  return positions.reduce<EntryExplorationLngLatBounds>(
    (bounds, [lng, lat]) => ({
      maxLat: Math.max(bounds.maxLat, lat),
      maxLng: Math.max(bounds.maxLng, lng),
      minLat: Math.min(bounds.minLat, lat),
      minLng: Math.min(bounds.minLng, lng),
    }),
    {
      maxLat: -Infinity,
      maxLng: -Infinity,
      minLat: Infinity,
      minLng: Infinity,
    }
  );
}

function projectLngLatToMapPoint({
  bounds,
  lat,
  lng,
  mapSize,
  padding,
}: {
  bounds: EntryExplorationLngLatBounds;
  lat: number;
  lng: number;
  mapSize: EntryExplorationDistrictMapSize;
  padding: number;
}): EntryExplorationDistrictSelectionPoint {
  const lngSpan = bounds.maxLng - bounds.minLng || 1;
  const latSpan = bounds.maxLat - bounds.minLat || 1;
  const drawableWidth = Math.max(mapSize.width - padding * 2, 1);
  const drawableDepth = Math.max(mapSize.depth - padding * 2, 1);
  const fitScale = Math.min(drawableWidth / lngSpan, drawableDepth / latSpan);
  const fittedWidth = lngSpan * fitScale;
  const fittedDepth = latSpan * fitScale;
  const xOffset = (mapSize.width - fittedWidth) / 2;
  const yOffset = (mapSize.depth - fittedDepth) / 2;

  return {
    x: -mapSize.width / 2 + xOffset + (lng - bounds.minLng) * fitScale,
    y: mapSize.depth / 2 - yOffset - (bounds.maxLat - lat) * fitScale,
  };
}

function isPointInRing(
  point: EntryExplorationDistrictSelectionPoint,
  ring: readonly EntryExplorationDistrictSelectionPoint[]
): boolean {
  let isInside = false;

  for (
    let index = 0, previousIndex = ring.length - 1;
    index < ring.length;
    previousIndex = index, index += 1
  ) {
    const currentPoint = ring[index];
    const previousPoint = ring[previousIndex];

    if (!currentPoint || !previousPoint) {
      continue;
    }

    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointInPolygon(
  point: EntryExplorationDistrictSelectionPoint,
  polygon: EntryExplorationProjectedDistrictPolygon
): boolean {
  const [outerRing, ...holeRings] = polygon.rings;

  if (!outerRing || !isPointInRing(point, outerRing)) {
    return false;
  }

  return !holeRings.some((ring) => isPointInRing(point, ring));
}

export function projectEntryExplorationDistrictBoundaries({
  boundaries,
  mapSize,
  padding,
}: ProjectEntryExplorationDistrictBoundariesInput): EntryExplorationProjectedDistrict[] {
  const bounds = getLngLatBounds(boundaries);

  if (!bounds) {
    return [];
  }

  return boundaries.map((boundary) => ({
    districtId: boundary.properties.districtId,
    name: boundary.properties.name,
    polygons: getBoundaryPolygons(boundary.geometry).map((polygon) => ({
      rings: polygon.map((ring) =>
        ring.map(([lng, lat]) =>
          projectLngLatToMapPoint({
            bounds,
            lat,
            lng,
            mapSize,
            padding,
          })
        )
      ),
    })),
  }));
}

export function getEntryExplorationProjectedDistrictRings(
  district: EntryExplorationProjectedDistrict
): readonly (readonly EntryExplorationDistrictSelectionPoint[])[] {
  return district.polygons.flatMap((polygon) => polygon.rings);
}

export function findEntryExplorationDistrictCenter(
  district: EntryExplorationProjectedDistrict
): EntryExplorationDistrictSelectionPoint {
  const points = getEntryExplorationProjectedDistrictRings(district).flatMap((ring) => ring);

  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const sum = points.reduce(
    (total, point) => ({
      x: total.x + point.x,
      y: total.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

export function calculateEntryExplorationSelectionPowerRatio(
  chargeDurationMs: number,
  chargeMaxDurationMs: number
): number {
  if (chargeMaxDurationMs <= 0) {
    return 1;
  }

  return clamp(chargeDurationMs / chargeMaxDurationMs, 0, 1);
}

export function normalizeEntryExplorationSelectionDirection(
  direction: EntryExplorationDistrictSelectionVector
): EntryExplorationDistrictSelectionVector {
  const length = Math.hypot(direction.x, direction.y);

  if (length === 0) {
    return DEFAULT_SELECTION_DIRECTION;
  }

  return {
    x: direction.x / length,
    y: direction.y / length,
  };
}

export function calculateEntryExplorationSelectionLandingPoint({
  chargeDurationMs,
  chargeMaxDurationMs,
  direction,
  maxDistance,
  minDistance,
  startPoint,
}: EntryExplorationDistrictSelectionLandingInput): EntryExplorationDistrictSelectionPoint {
  const powerRatio = calculateEntryExplorationSelectionPowerRatio(
    chargeDurationMs,
    chargeMaxDurationMs
  );
  const normalizedDirection = normalizeEntryExplorationSelectionDirection(direction);
  const distance = minDistance + (maxDistance - minDistance) * powerRatio;

  return {
    x: startPoint.x + normalizedDirection.x * distance,
    y: startPoint.y + normalizedDirection.y * distance,
  };
}

export function calculateEntryExplorationBounceHeight({
  bounceCount,
  maxHeight,
  progress,
}: {
  bounceCount: number;
  maxHeight: number;
  progress: number;
}): number {
  const clampedProgress = clamp(progress, 0, 1);

  if (clampedProgress >= 1 || bounceCount <= 0 || maxHeight <= 0) {
    return 0;
  }

  const localBounceProgress = (clampedProgress * bounceCount) % 1;
  const decayRatio = 1 - clampedProgress;

  return Math.sin(localBounceProgress * Math.PI) * maxHeight * decayRatio;
}

export function calculateEntryExplorationBounceSquashScale({
  bounceCount,
  intensity,
  progress,
}: {
  bounceCount: number;
  intensity: number;
  progress: number;
}): {
  xz: number;
  y: number;
} {
  const clampedProgress = clamp(progress, 0, 1);

  if (clampedProgress >= 1 || bounceCount <= 0 || intensity <= 0) {
    return { xz: 1, y: 1 };
  }

  const localBounceProgress = (clampedProgress * bounceCount) % 1;
  const distanceFromContact = Math.min(localBounceProgress, 1 - localBounceProgress);
  const contactRatio = clamp(1 - distanceFromContact / 0.18, 0, 1) * (1 - clampedProgress * 0.45);

  return {
    xz: 1 + intensity * contactRatio,
    y: 1 - intensity * contactRatio,
  };
}

export function calculateEntryExplorationBounceContactRatio({
  bounceCount,
  progress,
}: {
  bounceCount: number;
  progress: number;
}): number {
  const clampedProgress = clamp(progress, 0, 1);

  if (clampedProgress >= 1 || bounceCount <= 0) {
    return 0;
  }

  const localBounceProgress = (clampedProgress * bounceCount) % 1;
  const distanceFromContact = Math.min(localBounceProgress, 1 - localBounceProgress);

  return clamp(1 - distanceFromContact / 0.18, 0, 1) * (1 - clampedProgress * 0.45);
}

export function calculateEntryExplorationMapGradientRatio({
  mapSize,
  point,
}: {
  mapSize: EntryExplorationDistrictMapSize;
  point: EntryExplorationDistrictSelectionPoint;
}): number {
  const xRatio = mapSize.width <= 0 ? 0.5 : (point.x + mapSize.width / 2) / mapSize.width;
  const yRatio = mapSize.depth <= 0 ? 0.5 : (point.y + mapSize.depth / 2) / mapSize.depth;

  return clamp(xRatio * 0.55 + (1 - yRatio) * 0.45, 0, 1);
}

export function findEntryExplorationDistrictByPoint(
  point: EntryExplorationDistrictSelectionPoint,
  districts: readonly EntryExplorationProjectedDistrict[]
): EntryExplorationProjectedDistrict | null {
  return (
    districts.find((district) =>
      district.polygons.some((polygon) => isPointInPolygon(point, polygon))
    ) ?? null
  );
}
