import { describe, expect, it } from "vitest";

import { calculateZoomScaleRatio } from "./explorationZoomScale";

describe("calculateZoomScaleRatio", () => {
  it("keeps the reference zoom level at the original scale", () => {
    expect(calculateZoomScaleRatio(17, 17)).toBe(1);
  });

  it("shrinks by a quarter for every zoom level below the reference", () => {
    expect(calculateZoomScaleRatio(16, 17)).toBe(0.75);
    expect(calculateZoomScaleRatio(15, 17)).toBe(0.5);
  });

  it("scales continuously between zoom levels", () => {
    expect(calculateZoomScaleRatio(16.5, 17)).toBe(0.875);
  });
});
