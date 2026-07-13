import type { CircleLayerSpecification, GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import {
  EXPLORATION_PLACE_MARKER_RADIUS,
  EXPLORATION_PLACE_MARKER_STROKE_COLOR,
  EXPLORATION_PLACE_MARKER_STROKE_WIDTH,
  EXPLORATION_PLACE_MARKERS_LAYER_ID,
  EXPLORATION_PLACE_MARKERS_SOURCE_ID,
} from "../config/explorationPlaceMarkerLayer";

type PlaceMarkersLayerMap = Pick<MapLibreMap, "addLayer" | "addSource" | "getSource">;
type PlaceMarkersSourceMap = Pick<MapLibreMap, "getSource">;
type FeatureWithPlaceName = {
  properties?: {
    name?: unknown;
  } | null;
};

function createExplorationPlaceMarkersLayer(): CircleLayerSpecification {
  return {
    id: EXPLORATION_PLACE_MARKERS_LAYER_ID,
    source: EXPLORATION_PLACE_MARKERS_SOURCE_ID,
    type: "circle",
    paint: {
      "circle-radius": EXPLORATION_PLACE_MARKER_RADIUS,
      "circle-color": ["get", "markerColor"],
      "circle-stroke-color": EXPLORATION_PLACE_MARKER_STROKE_COLOR,
      "circle-stroke-width": EXPLORATION_PLACE_MARKER_STROKE_WIDTH,
    },
  };
}

export function addExplorationPlaceMarkersLayer(map: PlaceMarkersLayerMap): void {
  if (map.getSource(EXPLORATION_PLACE_MARKERS_SOURCE_ID)) {
    return;
  }

  map.addSource(EXPLORATION_PLACE_MARKERS_SOURCE_ID, {
    type: "geojson",
    data: createEmptyMapMarkerFeatureCollection(),
  });
  map.addLayer(createExplorationPlaceMarkersLayer());
}

export function updateExplorationPlaceMarkersSource(
  map: PlaceMarkersSourceMap,
  placeMarkers: MapMarkerFeatureCollection
): void {
  const source = map.getSource(EXPLORATION_PLACE_MARKERS_SOURCE_ID);

  if (source?.type !== "geojson") {
    return;
  }

  const geoJsonSource = source as GeoJSONSource;

  geoJsonSource.setData(placeMarkers as Parameters<GeoJSONSource["setData"]>[0]);
}

export function getExplorationPlaceMarkerName(feature?: FeatureWithPlaceName): string | null {
  const name = feature?.properties?.name;

  if (typeof name !== "string" || !name) {
    return null;
  }

  return name;
}
