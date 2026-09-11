import { describe, expect, test } from "vitest";

import {
  getEntryExplorationRectanglePoints,
  getEntryExplorationTileMapCameraFocus,
  getEntryExplorationTileMapCameraZoom,
} from "./entryExplorationTileMapCameraFit";

const cameraOffset = { x: 2.2, y: 24, z: 2.2 };
const focusPoint = { x: 0, z: 0 };
const points = getEntryExplorationRectanglePoints({ x: 0, z: 0 }, { depth: 9.79, width: 12 });

describe("entry exploration tile map camera fit", () => {
  test("keeps the max zoom when the map already fits the viewport width", () => {
    const zoom = getEntryExplorationTileMapCameraZoom({
      cameraOffset,
      focusPoint,
      maxZoom: 1.25,
      points,
      viewHalfWidth: 15.2,
      widthUsageRatio: 0.92,
    });

    expect(zoom).toBe(1.25);
  });

  test("zooms out until the map fits a narrow viewport width", () => {
    const viewHalfWidth = 4.39;
    const zoom = getEntryExplorationTileMapCameraZoom({
      cameraOffset,
      focusPoint,
      maxZoom: 1.25,
      points,
      viewHalfWidth,
      widthUsageRatio: 0.92,
    });
    const halfWidthOnScreen = points.reduce(
      (widest, point) => Math.max(widest, Math.abs((point.x - point.z) / Math.SQRT2)),
      0
    );

    expect(zoom).toBeLessThan(1.25);
    expect(halfWidthOnScreen * zoom).toBeCloseTo(viewHalfWidth * 0.92, 5);
  });

  test("falls back to the max zoom without points to fit", () => {
    const zoom = getEntryExplorationTileMapCameraZoom({
      cameraOffset,
      focusPoint,
      maxZoom: 1.25,
      points: [],
      viewHalfWidth: 4.39,
      widthUsageRatio: 0.92,
    });

    expect(zoom).toBe(1.25);
  });

  test("lifts the focus so the map sits at the requested screen ratio", () => {
    const viewHalfHeight = 9.5;
    const zoom = 0.48;
    const contentCenterScreenRatio = 0.37;
    const focus = getEntryExplorationTileMapCameraFocus({
      cameraOffset,
      contentCenterScreenRatio,
      focusPoint,
      points,
      viewHalfHeight,
      zoom,
    });
    const upAxisScale =
      cameraOffset.y /
      (Math.SQRT2 * cameraOffset.x * Math.hypot(Math.SQRT2 * cameraOffset.x, cameraOffset.y));
    const screenYs = points.map(
      (point) =>
        -(point.x - focus.x) * cameraOffset.x * upAxisScale -
        (point.z - focus.z) * cameraOffset.z * upAxisScale
    );
    const contentCenter = (Math.max(...screenYs) + Math.min(...screenYs)) / 2;
    const screenRatio = 0.5 - contentCenter / ((viewHalfHeight * 2) / zoom);

    expect(screenRatio).toBeCloseTo(contentCenterScreenRatio, 5);
  });

  test("keeps the focus when there is nothing to fit", () => {
    expect(
      getEntryExplorationTileMapCameraFocus({
        cameraOffset,
        contentCenterScreenRatio: 0.37,
        focusPoint,
        points: [],
        viewHalfHeight: 9.5,
        zoom: 0.48,
      })
    ).toEqual(focusPoint);
  });

  test("returns the four corners of a rectangle", () => {
    expect(getEntryExplorationRectanglePoints({ x: 10, z: 20 }, { depth: 4, width: 6 })).toEqual([
      { x: 7, z: 18 },
      { x: 13, z: 18 },
      { x: 7, z: 22 },
      { x: 13, z: 22 },
    ]);
  });
});
