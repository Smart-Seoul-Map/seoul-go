import { ENTRY_EXPLORATION_SCENE_CONFIG } from "./entryExplorationSceneConfig";

export const ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG = {
  cameraOffset: {
    x: 2.2,
    y: 24,
    z: 2.2,
  },
  cameraTransitionDurationMs: ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.transitionDurationMs,
  cameraNarrowViewportContentCenterRatio: 0.38,
  characterDestinationOffset: {
    x: -8.72,
    z: 3.02,
  },
  characterFacingDistance: 0.7,
  hitMarker: {
    cellOffsets: [
      { column: 0, row: 0 },
      { column: 0, row: -1 },
      { column: 0, row: 1 },
      { column: -1, row: 0 },
      { column: 1, row: 0 },
    ],
    cellOpacity: 0.55,
    centerScale: 0.78,
    ring: {
      inner: { radiusCells: 1.16, widthCells: 0.18 },
      outer: { radiusCells: 1.56, widthCells: 0.08 },
    },
  },
} as const;
