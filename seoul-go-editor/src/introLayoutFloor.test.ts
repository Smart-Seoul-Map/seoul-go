import { describe, expect, test } from "vitest";

import {
  INTRO_LAYOUT_FLOOR_PATTERNS,
  createIntroLayoutUploadedFloorPattern,
  getIntroLayoutFloorFileName,
  isIntroLayoutUploadedFloorPattern,
  normalizeIntroLayoutHexColor,
  recolorIntroLayoutPatternPixels,
} from "./introLayoutFloor";

const RED = { r: 255, g: 0, b: 0 };
const BLUE = { r: 0, g: 0, b: 255 };

describe("intro layout floor colors", () => {
  test("reads short and long HEX colors and rejects other text", () => {
    expect(normalizeIntroLayoutHexColor("#AbC")).toBe("#aabbcc");
    expect(normalizeIntroLayoutHexColor("12ab34")).toBe("#12ab34");
    expect(normalizeIntroLayoutHexColor("#12345")).toBe("");
    expect(normalizeIntroLayoutHexColor("red")).toBe("");
  });

  test("paints light pattern pixels with the base color and dark ones with the line color", () => {
    const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 40, 40, 40, 0]);
    const result = recolorIntroLayoutPatternPixels(pixels, RED, BLUE);

    expect([...result.slice(0, 4)]).toEqual([0, 0, 255, 255]);
    expect([...result.slice(4, 8)]).toEqual([255, 0, 0, 255]);
    expect(result[11]).toBe(0);
  });

  test("uses a darker base color for lines when no line color is given", () => {
    const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    const result = recolorIntroLayoutPatternPixels(pixels, RED, null);

    expect([...result.slice(0, 4)]).toEqual([140, 0, 0, 255]);
    expect([...result.slice(4, 8)]).toEqual([255, 0, 0, 255]);
  });

  test("names the exported tile after the pattern and colors", () => {
    expect(
      getIntroLayoutFloorFileName(
        { id: "brick.png", label: "brick", url: "/brick.png" },
        { base: "#AbC", line: "" }
      )
    ).toBe("floor-brick-aabbcc.png");
  });
});

describe("intro layout uploaded floor tiles", () => {
  test("names an uploaded tile after its file and keeps it apart from built-in tiles", () => {
    const uploaded = createIntroLayoutUploadedFloorPattern("floor.webp", "blob:tile");

    expect(uploaded).toMatchObject({ label: "floor", url: "blob:tile" });
    expect(INTRO_LAYOUT_FLOOR_PATTERNS.some(({ id }) => id === uploaded.id)).toBe(false);
    expect(isIntroLayoutUploadedFloorPattern(uploaded)).toBe(true);
    expect(INTRO_LAYOUT_FLOOR_PATTERNS.some(isIntroLayoutUploadedFloorPattern)).toBe(false);
  });

  test("gives the same file name the same id so its colors and combos come back", () => {
    expect(createIntroLayoutUploadedFloorPattern("my tile.png", "blob:a").id).toBe(
      createIntroLayoutUploadedFloorPattern("my tile.png", "blob:b").id
    );
  });

  test("exports an uploaded tile under its file name", () => {
    expect(
      getIntroLayoutFloorFileName(createIntroLayoutUploadedFloorPattern("my-tile.png", "blob:a"), {
        base: "",
        line: "",
      })
    ).toBe("floor-my-tile.png");
  });
});
