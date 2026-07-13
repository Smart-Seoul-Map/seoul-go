import { describe, expect, it } from "vitest";

import { OPEN_STREET_MAP_TILE_URL_TEMPLATE } from "@shared/constants/api";
import {
  MAP_STYLE_COLORS,
  MAP_STYLE_LAYER_IDS,
  MAP_STYLE_SOURCE_IDS,
  SMART_SEOUL_TILE_SIZE,
} from "@shared/constants/map";

import {
  EXPLORATION_MAP_BEARING,
  EXPLORATION_MAP_CENTER,
  EXPLORATION_MAP_LOCKED_ZOOM,
  EXPLORATION_MAP_PITCH,
} from "../config/explorationMapConfig";
import { createExplorationMapOptions } from "./explorationMapCreation";

describe("createExplorationMapOptions", () => {
  it("creates fixed exploration map view options", () => {
    const container = document.createElement("div");

    const options = createExplorationMapOptions({
      container,
      isSmartSeoulMapTileEnabled: true,
    });

    expect(options).toMatchObject({
      attributionControl: false,
      bearing: EXPLORATION_MAP_BEARING,
      center: EXPLORATION_MAP_CENTER,
      container,
      maxZoom: EXPLORATION_MAP_LOCKED_ZOOM,
      minZoom: EXPLORATION_MAP_LOCKED_ZOOM,
      pitch: EXPLORATION_MAP_PITCH,
      zoom: EXPLORATION_MAP_LOCKED_ZOOM,
    });
  });

  it("uses custom initial center when provided", () => {
    const options = createExplorationMapOptions({
      container: document.createElement("div"),
      initialCenter: { lng: 126.990703, lat: 37.532326 },
      isSmartSeoulMapTileEnabled: true,
    });

    expect(options.center).toEqual([126.990703, 37.532326]);
  });

  it("uses an empty base style when Smart Seoul mosaic tiles are enabled", () => {
    const options = createExplorationMapOptions({
      container: document.createElement("div"),
      isSmartSeoulMapTileEnabled: true,
    });

    expect(options.style).toMatchObject({
      layers: [
        {
          id: MAP_STYLE_LAYER_IDS.MAP_BACKGROUND,
          paint: {
            "background-color": MAP_STYLE_COLORS.EMPTY_BACKGROUND,
          },
          type: "background",
        },
      ],
      sources: {},
      version: 8,
    });
  });

  it("uses fallback raster style when Smart Seoul mosaic tiles are disabled", () => {
    const options = createExplorationMapOptions({
      container: document.createElement("div"),
      isSmartSeoulMapTileEnabled: false,
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
          tileSize: SMART_SEOUL_TILE_SIZE,
          tiles: [OPEN_STREET_MAP_TILE_URL_TEMPLATE],
          type: "raster",
        },
      },
      version: 8,
    });
  });
});
