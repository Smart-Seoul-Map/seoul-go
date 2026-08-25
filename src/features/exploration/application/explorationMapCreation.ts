import type { MapOptions } from "maplibre-gl";

import { SMART_SEOUL_TMS_INITIAL_ZOOM } from "@shared/constants/map";
import { buildRasterMapStyle } from "@shared/lib/maplibre/maplibreStyle";

import {
  EXPLORATION_MAP_BEARING,
  EXPLORATION_MAP_CENTER,
  EXPLORATION_MAP_MAX_ZOOM,
  EXPLORATION_MAP_MIN_ZOOM,
  EXPLORATION_MAP_PITCH,
} from "../config/explorationMapConfig";
import type { Coordinates } from "../domain/explorationGeo";

type CreateExplorationMapOptionsParams = {
  center?: Coordinates;
  container: MapOptions["container"];
  tileUrlTemplate: string;
};

export function createExplorationMapOptions({
  center,
  container,
  tileUrlTemplate,
}: CreateExplorationMapOptionsParams): MapOptions {
  return {
    attributionControl: false,
    bearing: EXPLORATION_MAP_BEARING,
    center: center ? [center.lng, center.lat] : EXPLORATION_MAP_CENTER,
    container,
    doubleClickZoom: false,
    maxZoom: EXPLORATION_MAP_MAX_ZOOM,
    minZoom: EXPLORATION_MAP_MIN_ZOOM,
    pitch: EXPLORATION_MAP_PITCH,
    scrollZoom: false,
    style: buildRasterMapStyle(tileUrlTemplate),
    touchZoomRotate: false,
    zoom: SMART_SEOUL_TMS_INITIAL_ZOOM,
  };
}
