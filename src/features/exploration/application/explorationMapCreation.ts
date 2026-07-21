import type { MapOptions } from "maplibre-gl";

import {
  SMART_SEOUL_TMS_INITIAL_ZOOM,
  SMART_SEOUL_TMS_MAX_ZOOM,
  SMART_SEOUL_TMS_MIN_ZOOM,
} from "@shared/constants/map";
import { buildRasterMapStyle } from "@shared/lib/maplibre/maplibreStyle";

import {
  EXPLORATION_MAP_BEARING,
  EXPLORATION_MAP_CENTER,
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
    maxZoom: SMART_SEOUL_TMS_MAX_ZOOM,
    minZoom: SMART_SEOUL_TMS_MIN_ZOOM,
    pitch: EXPLORATION_MAP_PITCH,
    style: buildRasterMapStyle(tileUrlTemplate),
    zoom: SMART_SEOUL_TMS_INITIAL_ZOOM,
  };
}
