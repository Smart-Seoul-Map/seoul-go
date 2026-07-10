import { API_BASE_URL, API_PROXY_PATH, END_POINTS } from "@shared/constants/api";
import {
  EPSG_5179_INVERSE_PROJECTION,
  EPSG_5179_PROJECTION,
  MAPLIBRE_TO_SMART_SEOUL_ZOOM_OFFSET,
  SMART_SEOUL_MAP_ID,
  SMART_SEOUL_MAP_KIND,
  SMART_SEOUL_RESOLUTIONS,
  SMART_SEOUL_TILE_EXTENT,
  SMART_SEOUL_TILE_GROUP_SIZE,
  SMART_SEOUL_TILE_ORIGIN,
  SMART_SEOUL_TILE_SIZE,
} from "@shared/constants/map";

export {
  SMART_SEOUL_MAP_ID,
  SMART_SEOUL_MAP_KIND,
  SMART_SEOUL_RESOLUTIONS,
  SMART_SEOUL_TILE_EXTENT,
  SMART_SEOUL_TILE_GROUP_SIZE,
  SMART_SEOUL_TILE_ORIGIN,
  SMART_SEOUL_TILE_SIZE,
} from "@shared/constants/map";

export const SMART_SEOUL_RASTER_TILE_PROXY_BASE_PATH = API_PROXY_PATH.SMART_SEOUL_MAP;

export type SmartSeoulTileCoordinate = {
  z: number;
  x: number;
  y: number;
};

export type SmartSeoulRasterTilePath = {
  mapKind: string;
  mapId: string;
  z: number;
  j: number;
  k: number;
  x: number;
  y: number;
};

export type BuildSmartSeoulRasterTileUrlOptions = SmartSeoulTileCoordinate & {
  apiKey: string;
  baseUrl?: string;
  mapKind?: string;
  mapId?: string;
  tileRows?: number;
  groupSize?: number;
};

export type BuildSmartSeoulRasterTileProxyUrlOptions = SmartSeoulTileCoordinate & {
  mapKind?: string;
  mapId?: string;
  tileRows?: number;
  groupSize?: number;
  proxyBasePath?: string;
};

type ProjectedCoordinate = {
  x: number;
  y: number;
};

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function calculateMeridianArc(latitudeRadians: number): number {
  const flattening = 1 / EPSG_5179_PROJECTION.GRS80_INVERSE_FLATTENING;
  const eccentricitySquared = 2 * flattening - flattening * flattening;
  const eccentricityFourth = eccentricitySquared * eccentricitySquared;
  const eccentricitySixth = eccentricityFourth * eccentricitySquared;

  return (
    EPSG_5179_PROJECTION.GRS80_SEMI_MAJOR_AXIS *
    ((1 - eccentricitySquared / 4 - (3 * eccentricityFourth) / 64 - (5 * eccentricitySixth) / 256) *
      latitudeRadians -
      ((3 * eccentricitySquared) / 8 +
        (3 * eccentricityFourth) / 32 +
        (45 * eccentricitySixth) / 1024) *
        Math.sin(2 * latitudeRadians) +
      ((15 * eccentricityFourth) / 256 + (45 * eccentricitySixth) / 1024) *
        Math.sin(4 * latitudeRadians) -
      ((35 * eccentricitySixth) / 3072) * Math.sin(6 * latitudeRadians))
  );
}

export function projectWgs84ToEpsg5179(longitude: number, latitude: number): ProjectedCoordinate {
  const flattening = 1 / EPSG_5179_PROJECTION.GRS80_INVERSE_FLATTENING;
  const eccentricitySquared = 2 * flattening - flattening * flattening;
  const secondEccentricitySquared = eccentricitySquared / (1 - eccentricitySquared);
  const latitudeRadians = degreesToRadians(latitude);
  const longitudeRadians = degreesToRadians(longitude);
  const originLatitudeRadians = degreesToRadians(EPSG_5179_PROJECTION.LATITUDE_OF_ORIGIN);
  const centralMeridianRadians = degreesToRadians(EPSG_5179_PROJECTION.CENTRAL_MERIDIAN);
  const sinLatitude = Math.sin(latitudeRadians);
  const cosLatitude = Math.cos(latitudeRadians);
  const tanLatitude = Math.tan(latitudeRadians);
  const radiusOfCurvature =
    EPSG_5179_PROJECTION.GRS80_SEMI_MAJOR_AXIS /
    Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);
  const tangentSquared = tanLatitude * tanLatitude;
  const etaSquared = secondEccentricitySquared * cosLatitude * cosLatitude;
  const longitudeDelta = (longitudeRadians - centralMeridianRadians) * cosLatitude;
  const meridianArcDelta =
    calculateMeridianArc(latitudeRadians) - calculateMeridianArc(originLatitudeRadians);

  const projectedX =
    EPSG_5179_PROJECTION.FALSE_EASTING +
    EPSG_5179_PROJECTION.SCALE_FACTOR *
      radiusOfCurvature *
      (longitudeDelta +
        ((1 - tangentSquared + etaSquared) * longitudeDelta ** 3) / 6 +
        ((5 -
          18 * tangentSquared +
          tangentSquared ** 2 +
          72 * etaSquared -
          58 * secondEccentricitySquared) *
          longitudeDelta ** 5) /
          120);
  const projectedY =
    EPSG_5179_PROJECTION.FALSE_NORTHING +
    EPSG_5179_PROJECTION.SCALE_FACTOR *
      (meridianArcDelta +
        radiusOfCurvature *
          tanLatitude *
          (longitudeDelta ** 2 / 2 +
            ((5 - tangentSquared + 9 * etaSquared + 4 * etaSquared ** 2) * longitudeDelta ** 4) /
              24 +
            ((61 -
              58 * tangentSquared +
              tangentSquared ** 2 +
              600 * etaSquared -
              330 * secondEccentricitySquared) *
              longitudeDelta ** 6) /
              720));

  return {
    x: projectedX,
    y: projectedY,
  };
}

export function projectEpsg5179ToWgs84(
  x: number,
  y: number
): {
  longitude: number;
  latitude: number;
} {
  let longitude =
    EPSG_5179_PROJECTION.CENTRAL_MERIDIAN +
    (x - EPSG_5179_PROJECTION.FALSE_EASTING) /
      EPSG_5179_INVERSE_PROJECTION.LONGITUDE_DEGREE_METER_APPROXIMATION;
  let latitude =
    EPSG_5179_PROJECTION.LATITUDE_OF_ORIGIN +
    (y - EPSG_5179_PROJECTION.FALSE_NORTHING) /
      EPSG_5179_INVERSE_PROJECTION.LATITUDE_DEGREE_METER_APPROXIMATION;

  for (let index = 0; index < EPSG_5179_INVERSE_PROJECTION.REFINEMENT_ITERATIONS; index += 1) {
    const projected = projectWgs84ToEpsg5179(longitude, latitude);
    const metersPerLongitudeDegree =
      EPSG_5179_INVERSE_PROJECTION.WGS84_METERS_PER_LATITUDE_DEGREE *
      Math.cos(degreesToRadians(latitude));

    longitude += (x - projected.x) / metersPerLongitudeDegree;
    latitude += (y - projected.y) / EPSG_5179_INVERSE_PROJECTION.WGS84_METERS_PER_LATITUDE_DEGREE;
  }

  return { longitude, latitude };
}

export function getSmartSeoulResolution(zoom: number): number {
  const resolution = SMART_SEOUL_RESOLUTIONS[zoom - 1];

  if (resolution === undefined) {
    throw new Error(`Unsupported Smart Seoul tile zoom: ${zoom}`);
  }

  return resolution;
}

export function getSmartSeoulTileRows(zoom: number): number {
  const resolution = getSmartSeoulResolution(zoom);

  return Math.round(
    (SMART_SEOUL_TILE_ORIGIN[1] - SMART_SEOUL_TILE_EXTENT[1]) / (SMART_SEOUL_TILE_SIZE * resolution)
  );
}

export function convertWgs84ToSmartSeoulTileGrid({
  longitude,
  latitude,
  z,
}: {
  longitude: number;
  latitude: number;
  z: number;
}): SmartSeoulTileCoordinate {
  const resolution = getSmartSeoulResolution(z);
  const projected = projectWgs84ToEpsg5179(longitude, latitude);
  const tileX = Math.floor(
    (projected.x - SMART_SEOUL_TILE_ORIGIN[0]) / (SMART_SEOUL_TILE_SIZE * resolution)
  );
  const tileYFromTop = Math.floor(
    (SMART_SEOUL_TILE_ORIGIN[1] - projected.y) / (SMART_SEOUL_TILE_SIZE * resolution)
  );

  return {
    z,
    x: tileX,
    y: getSmartSeoulTileRows(z) - tileYFromTop - 1,
  };
}

function calculateMapLibreTileCenter({ z, x, y }: SmartSeoulTileCoordinate): {
  longitude: number;
  latitude: number;
} {
  const tileCount = 2 ** z;
  const longitude = ((x + 0.5) / tileCount) * 360 - 180;
  const latitude =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / tileCount))) * 180) / Math.PI;

  return { longitude, latitude };
}

function convertMapLibreZoomToSmartSeoulZoomIndex(mapLibreZoom: number): number {
  return Math.max(
    0,
    Math.min(SMART_SEOUL_RESOLUTIONS.length - 1, mapLibreZoom - MAPLIBRE_TO_SMART_SEOUL_ZOOM_OFFSET)
  );
}

export function convertMapLibreTileToSmartSeoulTilePath({
  mapKind = SMART_SEOUL_MAP_KIND,
  mapId = SMART_SEOUL_MAP_ID,
  z,
  x,
  y,
  tileRows,
  groupSize = SMART_SEOUL_TILE_GROUP_SIZE,
}: Omit<BuildSmartSeoulRasterTileProxyUrlOptions, "proxyBasePath">): SmartSeoulRasterTilePath {
  const smartSeoulZoomIndex = convertMapLibreZoomToSmartSeoulZoomIndex(z);
  const resolution = SMART_SEOUL_RESOLUTIONS[smartSeoulZoomIndex];

  if (resolution === undefined) {
    throw new Error(`Unsupported Smart Seoul tile zoom: ${z}`);
  }

  const tileCenter = calculateMapLibreTileCenter({ z, x, y });
  const projectedCenter = projectWgs84ToEpsg5179(tileCenter.longitude, tileCenter.latitude);
  const smartTileX = Math.floor(
    (projectedCenter.x - SMART_SEOUL_TILE_ORIGIN[0]) / (SMART_SEOUL_TILE_SIZE * resolution)
  );
  const tileYFromTop = Math.floor(
    (SMART_SEOUL_TILE_ORIGIN[1] - projectedCenter.y) / (SMART_SEOUL_TILE_SIZE * resolution)
  );
  const smartTileRows =
    tileRows ??
    Math.round(
      (SMART_SEOUL_TILE_ORIGIN[1] - SMART_SEOUL_TILE_EXTENT[1]) /
        (SMART_SEOUL_TILE_SIZE * resolution)
    );
  const smartTileY = smartTileRows - tileYFromTop - 1;
  const groupX = Math.floor(smartTileX / groupSize);
  const groupY = Math.floor(smartTileY / groupSize);
  const smartZoom = smartSeoulZoomIndex + 1;

  return {
    mapKind,
    mapId,
    z: smartZoom,
    j: groupX,
    k: groupY,
    x: smartTileX,
    y: smartTileY,
  };
}

export function buildSmartSeoulRasterTilePath({
  mapKind,
  mapId,
  z,
  j,
  k,
  x,
  y,
}: SmartSeoulRasterTilePath): string {
  return END_POINTS.smartSeoulRasterTile({ mapKind, mapId, z, j, k, x, y });
}

export function buildSmartSeoulRasterTileGridPath({
  mapKind = SMART_SEOUL_MAP_KIND,
  mapId = SMART_SEOUL_MAP_ID,
  z,
  x,
  y,
  groupSize = SMART_SEOUL_TILE_GROUP_SIZE,
}: SmartSeoulTileCoordinate & {
  mapKind?: string;
  mapId?: string;
  groupSize?: number;
}): string {
  return buildSmartSeoulRasterTilePath({
    mapKind,
    mapId,
    z,
    j: Math.floor(x / groupSize),
    k: Math.floor(y / groupSize),
    x,
    y,
  });
}

export function buildSmartSeoulRasterTileUrl({
  apiKey,
  baseUrl = API_BASE_URL.SMART_SEOUL,
  ...coordinate
}: BuildSmartSeoulRasterTileUrlOptions): string {
  const tilePath = convertMapLibreTileToSmartSeoulTilePath(coordinate);

  return `${baseUrl}/${encodeURIComponent(apiKey)}${buildSmartSeoulRasterTilePath(tilePath)}`;
}

export function buildSmartSeoulRasterTileProxyUrl({
  proxyBasePath = SMART_SEOUL_RASTER_TILE_PROXY_BASE_PATH,
  ...coordinate
}: BuildSmartSeoulRasterTileProxyUrlOptions): string {
  const tilePath = convertMapLibreTileToSmartSeoulTilePath(coordinate);

  return `${proxyBasePath}${buildSmartSeoulRasterTilePath(tilePath)}`;
}
