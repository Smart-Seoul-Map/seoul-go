import { describe, expect, it } from "vitest";

import { SMART_SEOUL_TMS_TILE_URL_TEMPLATE } from "@shared/constants/api";
import {
  MAP_STYLE_LAYER_IDS,
  MAP_STYLE_SOURCE_IDS,
  SMART_SEOUL_TILE_SIZE,
  SMART_SEOUL_TMS_INITIAL_ZOOM,
  SMART_SEOUL_TMS_MAX_ZOOM,
  SMART_SEOUL_TMS_MIN_ZOOM,
} from "@shared/constants/map";

import {
  EXPLORATION_MAP_BEARING,
  EXPLORATION_MAP_CENTER,
  EXPLORATION_MAP_PITCH,
} from "../config/explorationMapConfig";
import { createExplorationMapOptions } from "./explorationMapCreation";

describe("createExplorationMapOptions", () => {
  it("creates fixed exploration map view options", () => {
    const container = document.createElement("div");

    const options = createExplorationMapOptions({
      container,
      tileUrlTemplate: SMART_SEOUL_TMS_TILE_URL_TEMPLATE,
    });

    expect(options).toMatchObject({
      attributionControl: false,
      bearing: EXPLORATION_MAP_BEARING,
      center: EXPLORATION_MAP_CENTER,
      container,
      maxZoom: SMART_SEOUL_TMS_MAX_ZOOM,
      minZoom: SMART_SEOUL_TMS_MIN_ZOOM,
      pitch: EXPLORATION_MAP_PITCH,
      zoom: SMART_SEOUL_TMS_INITIAL_ZOOM,
    });
  });

  it("uses Smart Seoul TMS raster style", () => {
    const options = createExplorationMapOptions({
      container: document.createElement("div"),
      tileUrlTemplate: SMART_SEOUL_TMS_TILE_URL_TEMPLATE,
    });

    expect(options.style).toMatchObject({
      layers: [
        {
          id: MAP_STYLE_LAYER_IDS.SMART_SEOUL_RASTER,
          source: MAP_STYLE_SOURCE_IDS.SMART_SEOUL_RASTER,
          type: "raster",
        },
      ],
      sources: {
        [MAP_STYLE_SOURCE_IDS.SMART_SEOUL_RASTER]: {
          maxzoom: SMART_SEOUL_TMS_MAX_ZOOM,
          minzoom: SMART_SEOUL_TMS_MIN_ZOOM,
          tileSize: SMART_SEOUL_TILE_SIZE,
          tiles: [SMART_SEOUL_TMS_TILE_URL_TEMPLATE],
          type: "raster",
        },
      },
      version: 8,
    });
  });
});
