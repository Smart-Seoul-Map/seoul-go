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
  EXPLORATION_MAP_MAX_ZOOM,
  EXPLORATION_MAP_MIN_ZOOM,
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
      maxZoom: EXPLORATION_MAP_MAX_ZOOM,
      minZoom: EXPLORATION_MAP_MIN_ZOOM,
      pitch: EXPLORATION_MAP_PITCH,
      zoom: SMART_SEOUL_TMS_INITIAL_ZOOM,
    });
  });

  it("leaves room to zoom both in and out from the default level", () => {
    const options = createExplorationMapOptions({
      container: document.createElement("div"),
      tileUrlTemplate: SMART_SEOUL_TMS_TILE_URL_TEMPLATE,
    });

    expect(options.minZoom).toBeLessThan(SMART_SEOUL_TMS_INITIAL_ZOOM);
    expect(options.maxZoom).toBeGreaterThan(SMART_SEOUL_TMS_INITIAL_ZOOM);
  });

  it("keeps every zoom input on whole levels", () => {
    const options = createExplorationMapOptions({
      container: document.createElement("div"),
      tileUrlTemplate: SMART_SEOUL_TMS_TILE_URL_TEMPLATE,
    });

    const zoomSnap = options.zoomSnap ?? 0;

    expect(zoomSnap).toBeGreaterThan(0);
    expect(((options.maxZoom ?? 0) - (options.minZoom ?? 0)) % zoomSnap).toBeCloseTo(0);
    expect(options.doubleClickZoom).toBe(false);
    expect(options.touchZoomRotate).toBe(false);
  });

  it("keeps the interaction zoom range inside the tile source zoom range", () => {
    expect(EXPLORATION_MAP_MIN_ZOOM).toBeGreaterThanOrEqual(SMART_SEOUL_TMS_MIN_ZOOM);
    expect(EXPLORATION_MAP_MAX_ZOOM).toBeLessThanOrEqual(SMART_SEOUL_TMS_MAX_ZOOM);
  });

  it("uses custom center when it is provided", () => {
    const center = { lng: 126.990703, lat: 37.532326 };

    const options = createExplorationMapOptions({
      center,
      container: document.createElement("div"),
      tileUrlTemplate: SMART_SEOUL_TMS_TILE_URL_TEMPLATE,
    });

    expect(options.center).toEqual([center.lng, center.lat]);
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
