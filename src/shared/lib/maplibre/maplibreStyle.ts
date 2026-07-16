import type { StyleSpecification } from "maplibre-gl";

import { SMART_SEOUL_TMS_TILE_URL_TEMPLATE } from "@shared/constants/api";
import {
  MAP_STYLE_COLORS,
  MAP_STYLE_LAYER_IDS,
  MAP_STYLE_SOURCE_IDS,
  SMART_SEOUL_TILE_SIZE,
  SMART_SEOUL_TMS_MAX_ZOOM,
  SMART_SEOUL_TMS_MIN_ZOOM,
} from "@shared/constants/map";

export const DEFAULT_TILE_URL_TEMPLATE = SMART_SEOUL_TMS_TILE_URL_TEMPLATE;

export function buildEmptyMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: MAP_STYLE_LAYER_IDS.MAP_BACKGROUND,
        type: "background",
        paint: {
          "background-color": MAP_STYLE_COLORS.EMPTY_BACKGROUND,
        },
      },
    ],
  };
}

export function buildRasterMapStyle(tileUrlTemplate: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      [MAP_STYLE_SOURCE_IDS.SMART_SEOUL_RASTER]: {
        maxzoom: SMART_SEOUL_TMS_MAX_ZOOM,
        minzoom: SMART_SEOUL_TMS_MIN_ZOOM,
        type: "raster",
        tiles: [tileUrlTemplate],
        tileSize: SMART_SEOUL_TILE_SIZE,
      },
    },
    layers: [
      {
        id: MAP_STYLE_LAYER_IDS.SMART_SEOUL_RASTER,
        source: MAP_STYLE_SOURCE_IDS.SMART_SEOUL_RASTER,
        type: "raster",
      },
    ],
  };
}
