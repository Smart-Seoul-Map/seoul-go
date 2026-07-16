import { describe, expect, test } from "vitest";

import { SMART_SEOUL_TMS_TILE_URL_TEMPLATE } from "@shared/constants/api";
import { SMART_SEOUL_TMS_MAX_ZOOM, SMART_SEOUL_TMS_MIN_ZOOM } from "@shared/constants/map";

import { buildRasterMapStyle, DEFAULT_TILE_URL_TEMPLATE } from "./maplibreStyle";

describe("MapLibre style", () => {
  test("builds a raster source and layer from a tile URL template", () => {
    const style = buildRasterMapStyle("https://example.com/{z}/{x}/{y}.png");

    expect(style.version).toBe(8);
    expect(style.sources["smart-seoul-raster"]).toMatchObject({
      maxzoom: SMART_SEOUL_TMS_MAX_ZOOM,
      minzoom: SMART_SEOUL_TMS_MIN_ZOOM,
      type: "raster",
      tiles: ["https://example.com/{z}/{x}/{y}.png"],
      tileSize: 256,
    });
    expect(style.layers).toEqual([
      {
        id: "smart-seoul-raster",
        source: "smart-seoul-raster",
        type: "raster",
      },
    ]);
  });

  test("uses Smart Seoul TMS proxy tiles as the default tile URL template", () => {
    expect(DEFAULT_TILE_URL_TEMPLATE).toBe(SMART_SEOUL_TMS_TILE_URL_TEMPLATE);
  });
});
