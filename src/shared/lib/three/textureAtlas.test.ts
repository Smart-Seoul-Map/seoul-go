import { describe, expect, test } from "vitest";

import { createAtlasPlaneGeometry } from "./textureAtlas";

describe("atlas geometry", () => {
  test("converts top-left pixel frames and anchors artwork at its bottom", () => {
    const geometry = createAtlasPlaneGeometry(
      { x: 256, y: 512, width: 512, height: 256 },
      { width: 2048, height: 2048 },
      4
    );
    const uv = geometry.getAttribute("uv");
    expect([uv.getX(0), uv.getY(0)]).toEqual([0.125, 0.75]);
    expect([uv.getX(3), uv.getY(3)]).toEqual([0.375, 0.625]);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.min.y).toBe(0);
    expect(geometry.boundingBox?.max.y).toBe(2);
    geometry.dispose();
  });

  test("rejects frames extending beyond the texture", () => {
    expect(() =>
      createAtlasPlaneGeometry(
        { x: 2000, y: 0, width: 100, height: 100 },
        { width: 2048, height: 2048 },
        1
      )
    ).toThrow("Invalid texture atlas frame");
  });
});
