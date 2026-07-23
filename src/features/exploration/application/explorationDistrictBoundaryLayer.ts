import type {
  FillLayerSpecification,
  LineLayerSpecification,
  Map as MapLibreMap,
} from "maplibre-gl";

import {
  EXPLORATION_DISTRICT_BOUNDARY_COLOR,
  EXPLORATION_DISTRICT_BOUNDARY_LAYER_ID,
  EXPLORATION_DISTRICT_BOUNDARY_SOURCE_ID,
  EXPLORATION_DISTRICT_BOUNDARY_WIDTH,
  EXPLORATION_DISTRICT_MASK_COLOR,
  EXPLORATION_DISTRICT_MASK_LAYER_ID,
  EXPLORATION_DISTRICT_MASK_OPACITY,
  EXPLORATION_DISTRICT_MASK_SOURCE_ID,
} from "../config/explorationDistrictBoundaryLayer";
import {
  createExplorationDistrictMask,
  type ExplorationDistrictBoundaryFeature,
} from "../domain/explorationDistrictBoundary";

type DistrictBoundaryLayerMap = Pick<MapLibreMap, "addLayer" | "addSource" | "getSource">;

function createExplorationDistrictMaskLayer(): FillLayerSpecification {
  return {
    id: EXPLORATION_DISTRICT_MASK_LAYER_ID,
    source: EXPLORATION_DISTRICT_MASK_SOURCE_ID,
    type: "fill",
    paint: {
      "fill-color": EXPLORATION_DISTRICT_MASK_COLOR,
      "fill-opacity": EXPLORATION_DISTRICT_MASK_OPACITY,
    },
  };
}

function createExplorationDistrictBoundaryLayer(): LineLayerSpecification {
  return {
    id: EXPLORATION_DISTRICT_BOUNDARY_LAYER_ID,
    source: EXPLORATION_DISTRICT_BOUNDARY_SOURCE_ID,
    type: "line",
    paint: {
      "line-color": EXPLORATION_DISTRICT_BOUNDARY_COLOR,
      "line-width": EXPLORATION_DISTRICT_BOUNDARY_WIDTH,
    },
  };
}

export function addExplorationDistrictBoundaryLayers(
  map: DistrictBoundaryLayerMap,
  boundary: ExplorationDistrictBoundaryFeature | null
): void {
  if (!boundary || map.getSource(EXPLORATION_DISTRICT_BOUNDARY_SOURCE_ID)) {
    return;
  }

  map.addSource(EXPLORATION_DISTRICT_MASK_SOURCE_ID, {
    type: "geojson",
    data: createExplorationDistrictMask(boundary),
  });
  map.addLayer(createExplorationDistrictMaskLayer());
  map.addSource(EXPLORATION_DISTRICT_BOUNDARY_SOURCE_ID, {
    type: "geojson",
    data: boundary,
  });
  map.addLayer(createExplorationDistrictBoundaryLayer());
}
