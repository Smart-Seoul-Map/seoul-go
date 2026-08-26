import type {
  DataDrivenPropertyValueSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  SymbolLayerSpecification,
} from "maplibre-gl";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { EXPLORATION_MAP_MAX_ZOOM, EXPLORATION_MAP_MIN_ZOOM } from "../config/explorationMapConfig";
import {
  EXPLORATION_PLACE_MARKER_ICON_SIZE,
  EXPLORATION_PLACE_MARKER_IMAGES,
  EXPLORATION_PLACE_MARKERS_LAYER_ID,
  EXPLORATION_PLACE_MARKERS_SOURCE_ID,
} from "../config/explorationPlaceMarkerLayer";
import { calculateZoomScaleRatio } from "../domain/explorationZoomScale";

const ICON_SIZE_STOP_ZOOM_HEADROOM = 1;

type PlaceMarkersLayerMap = Pick<
  MapLibreMap,
  "addImage" | "addLayer" | "addSource" | "getSource" | "hasImage" | "loadImage"
>;
type PlaceMarkersSourceMap = Pick<MapLibreMap, "getSource">;
type AddExplorationPlaceMarkersLayerOptions = {
  getPlaceMarkers?: () => MapMarkerFeatureCollection;
};
type FeatureWithPlaceMarkerSelection = {
  geometry?: {
    coordinates?: unknown;
  } | null;
  properties?: {
    id?: unknown;
    imageUrl?: unknown;
    markerColor?: unknown;
    name?: unknown;
    themeId?: unknown;
    themeName?: unknown;
  } | null;
};

export type ExplorationPlaceMarkerSelection = {
  id: string;
  imageUrl: string;
  markerColor: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  themeId: string;
  themeName: string;
};

function createPlaceMarkerIconSizeStop(zoomLevel: number): number[] {
  return [
    zoomLevel,
    EXPLORATION_PLACE_MARKER_ICON_SIZE *
      calculateZoomScaleRatio(zoomLevel, EXPLORATION_MAP_MAX_ZOOM),
  ];
}

function createPlaceMarkerIconSize(): DataDrivenPropertyValueSpecification<number> {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    ...createPlaceMarkerIconSizeStop(EXPLORATION_MAP_MIN_ZOOM),
    ...createPlaceMarkerIconSizeStop(EXPLORATION_MAP_MAX_ZOOM + ICON_SIZE_STOP_ZOOM_HEADROOM),
  ];
}

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
      "icon-size": createPlaceMarkerIconSize(),
    },
  };
}

export async function addExplorationPlaceMarkersLayer(
  map: PlaceMarkersLayerMap,
  { getPlaceMarkers }: AddExplorationPlaceMarkersLayerOptions = {}
): Promise<void> {
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
    data: getPlaceMarkers?.() ?? createEmptyMapMarkerFeatureCollection(),
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

export function getExplorationPlaceMarkerSelection(
  feature?: FeatureWithPlaceMarkerSelection
): ExplorationPlaceMarkerSelection | null {
  const id = readString(feature?.properties?.id);
  const name = readString(feature?.properties?.name);
  const themeId = readString(feature?.properties?.themeId);
  const themeName = readString(feature?.properties?.themeName);
  const markerColor = readString(feature?.properties?.markerColor);
  const imageUrl = readString(feature?.properties?.imageUrl);
  const coordinates = feature?.geometry?.coordinates;

  if (
    !id ||
    !name ||
    !themeId ||
    !themeName ||
    !markerColor ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    return null;
  }

  const [lng, lat] = coordinates;

  if (typeof lng !== "number" || typeof lat !== "number") {
    return null;
  }

  return {
    id,
    imageUrl,
    markerColor,
    name,
    position: {
      lat,
      lng,
    },
    themeId,
    themeName,
  };
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
