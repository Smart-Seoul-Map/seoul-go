import type { GeoJSONSource, Map as MapLibreMap, SymbolLayerSpecification } from "maplibre-gl";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import {
  EXPLORATION_PLACE_MARKER_ICON_SIZE,
  EXPLORATION_PLACE_MARKER_IMAGES,
  EXPLORATION_PLACE_MARKERS_LAYER_ID,
  EXPLORATION_PLACE_MARKERS_SOURCE_ID,
} from "../config/explorationPlaceMarkerLayer";

type PlaceMarkersLayerMap = Pick<
  MapLibreMap,
  "addImage" | "addLayer" | "addSource" | "getSource" | "hasImage" | "loadImage"
>;
type PlaceMarkersSourceMap = Pick<MapLibreMap, "getSource">;
type FeatureWithPlaceName = {
  properties?: {
    name?: unknown;
  } | null;
};

function createExplorationPlaceMarkersLayer(): SymbolLayerSpecification {
  return {
    id: EXPLORATION_PLACE_MARKERS_LAYER_ID,
    source: EXPLORATION_PLACE_MARKERS_SOURCE_ID,
    type: "symbol",
    layout: {
      "icon-allow-overlap": true,
      "icon-anchor": "bottom",
      "icon-ignore-placement": true,
      "icon-image": ["get", "markerImage"],
      "icon-size": EXPLORATION_PLACE_MARKER_ICON_SIZE,
    },
  };
}

export async function addExplorationPlaceMarkersLayer(map: PlaceMarkersLayerMap): Promise<void> {
  if (map.getSource(EXPLORATION_PLACE_MARKERS_SOURCE_ID)) {
    return;
  }

  await Promise.all(
    EXPLORATION_PLACE_MARKER_IMAGES.map(async ({ id, url }) => {
      if (map.hasImage(id)) {
        return;
      }

      const image = await map.loadImage(url);

      if (!map.hasImage(id)) {
        map.addImage(id, image.data);
      }
    })
  );

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
