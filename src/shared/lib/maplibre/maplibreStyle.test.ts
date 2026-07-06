import { describe, expect, test } from "vitest";

import { buildRasterMapStyle } from "./maplibreStyle";

describe("MapLibre 지도 스타일", () => {
  test("타일 URL 템플릿을 raster source와 layer로 구성한다", () => {
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
