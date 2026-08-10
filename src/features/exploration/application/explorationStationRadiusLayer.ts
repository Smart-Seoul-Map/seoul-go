import type {
  FillLayerSpecification,
  LineLayerSpecification,
  Map as MapLibreMap,
} from "maplibre-gl";

import { MAP_AREA_FILL_STYLE, MAP_AREA_LINE_STYLE } from "@shared/styles/mapAreaLayerStyle";

import {
  EXPLORATION_STATION_RADIUS_FILL_LAYER_ID,
  EXPLORATION_STATION_RADIUS_LINE_LAYER_ID,
  EXPLORATION_STATION_RADIUS_MASK_SOURCE_ID,
  EXPLORATION_STATION_RADIUS_SOURCE_ID,
} from "../config/explorationStationRadiusLayer";
import type { Coordinates } from "../domain/explorationGeo";

type StationRadiusLayerMap = Pick<MapLibreMap, "addLayer" | "addSource" | "getSource">;

export type ExplorationStationRadiusFeature = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
};

const EARTH_RADIUS_METERS = 6_371_000;
const CIRCLE_SEGMENT_COUNT = 64;
const WORLD_OUTER_RING: [number, number][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function createExplorationStationRadiusFeature(
  center: Coordinates,
  radiusMeters: number
): ExplorationStationRadiusFeature {
  const centerLatRadians = toRadians(center.lat);
  const centerLngRadians = toRadians(center.lng);
  const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
  const coordinates = Array.from({ length: CIRCLE_SEGMENT_COUNT + 1 }, (_, index) => {
    const bearing = (index / CIRCLE_SEGMENT_COUNT) * Math.PI * 2;
    const latRadians = Math.asin(
      Math.sin(centerLatRadians) * Math.cos(angularDistance) +
        Math.cos(centerLatRadians) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lngRadians =
      centerLngRadians +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatRadians),
        Math.cos(angularDistance) - Math.sin(centerLatRadians) * Math.sin(latRadians)
      );

    return [toDegrees(lngRadians), toDegrees(latRadians)] as [number, number];
  });

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
}

export function createExplorationStationRadiusMaskFeature(
  radiusFeature: ExplorationStationRadiusFeature
): ExplorationStationRadiusFeature {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [WORLD_OUTER_RING, radiusFeature.geometry.coordinates[0]],
    },
  };
}

function createExplorationStationRadiusFillLayer(): FillLayerSpecification {
  return {
    id: EXPLORATION_STATION_RADIUS_FILL_LAYER_ID,
    source: EXPLORATION_STATION_RADIUS_MASK_SOURCE_ID,
    type: "fill",
    paint: {
      "fill-color": MAP_AREA_FILL_STYLE.color,
      "fill-opacity": MAP_AREA_FILL_STYLE.opacity,
    },
  };
}

function createExplorationStationRadiusLineLayer(): LineLayerSpecification {
  return {
    id: EXPLORATION_STATION_RADIUS_LINE_LAYER_ID,
    source: EXPLORATION_STATION_RADIUS_SOURCE_ID,
    type: "line",
    paint: {
      "line-color": MAP_AREA_LINE_STYLE.color,
      "line-opacity": MAP_AREA_LINE_STYLE.opacity,
      "line-width": MAP_AREA_LINE_STYLE.width,
    },
  };
}

export function addExplorationStationRadiusLayers(
  map: StationRadiusLayerMap,
  center: Coordinates,
  radiusMeters: number | undefined
): void {
  if (
    radiusMeters === undefined ||
    !Number.isFinite(radiusMeters) ||
    radiusMeters <= 0 ||
    map.getSource(EXPLORATION_STATION_RADIUS_SOURCE_ID)
  ) {
    return;
  }

  const radiusFeature = createExplorationStationRadiusFeature(center, radiusMeters);

  map.addSource(EXPLORATION_STATION_RADIUS_MASK_SOURCE_ID, {
    type: "geojson",
    data: createExplorationStationRadiusMaskFeature(radiusFeature),
  });
  map.addLayer(createExplorationStationRadiusFillLayer());
  map.addSource(EXPLORATION_STATION_RADIUS_SOURCE_ID, {
    type: "geojson",
    data: radiusFeature,
  });
  map.addLayer(createExplorationStationRadiusLineLayer());
}
