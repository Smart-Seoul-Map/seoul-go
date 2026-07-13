import type { MapOptions } from "maplibre-gl";

import {
  buildEmptyMapStyle,
  buildRasterMapStyle,
  DEFAULT_TILE_URL_TEMPLATE,
} from "@shared/lib/maplibre/maplibreStyle";

import {
  EXPLORATION_MAP_BEARING,
  EXPLORATION_MAP_CENTER,
  EXPLORATION_MAP_LOCKED_ZOOM,
  EXPLORATION_MAP_PITCH,
} from "../config/explorationMapConfig";
import type { Coordinates } from "../domain/explorationGeo";

type CreateExplorationMapOptionsParams = {
  container: MapOptions["container"];
  initialCenter?: Coordinates;
  isSmartSeoulMapTileEnabled: boolean;
};

export function createExplorationMapOptions({
  container,
  initialCenter,
  isSmartSeoulMapTileEnabled,
}: CreateExplorationMapOptionsParams): MapOptions {
  return {
    attributionControl: false,
    bearing: EXPLORATION_MAP_BEARING,
    center: initialCenter ? [initialCenter.lng, initialCenter.lat] : EXPLORATION_MAP_CENTER,
    container,
    maxZoom: EXPLORATION_MAP_LOCKED_ZOOM,
    minZoom: EXPLORATION_MAP_LOCKED_ZOOM,
    pitch: EXPLORATION_MAP_PITCH,
    style: isSmartSeoulMapTileEnabled
      ? buildEmptyMapStyle()
      : buildRasterMapStyle(DEFAULT_TILE_URL_TEMPLATE),
    zoom: EXPLORATION_MAP_LOCKED_ZOOM,
  };
}
