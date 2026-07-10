import { describe, expect, test } from "vitest";

import { buildEmptyMapStyle, buildRasterMapStyle } from "./maplibreStyle";

describe("MapLibre style", () => {
  test("builds an empty background style for image-source based maps", () => {
    const style = buildEmptyMapStyle();

    expect(style).toMatchObject({
      version: 8,
      sources: {},
      layers: [
        {
          id: "map-background",
          type: "background",
        },
      ],
    });
  });

  test("builds a raster source and layer from a tile URL template", () => {
    const style = buildRasterMapStyle("https://example.com/{z}/{x}/{y}.png");

    expect(style.version).toBe(8);
    expect(style.sources["smart-seoul-raster"]).toMatchObject({
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
});
