import { ENTRY_EXPLORATION_SCENE_CONFIG } from "./entryExplorationSceneConfig";

const SCENE_TOKEN_COLOR = {
  bgFloating: 0xffffff,
  blue500: 0x08b2f0,
  blue600: 0x0082ff,
} as const;

export const ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG = {
  cameraOffset: {
    x: 2.2,
    y: 24,
    z: 2.2,
  },
  cameraTransitionDurationMs: ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.transitionDurationMs,
  cameraFocusOffset: {
    x: -0.72,
    z: -0.72,
  },
  cameraNarrowViewportContentCenterRatio: 0.38,
  cameraViewWidthUsageRatio: 0.88,
  cameraZoom: 1.25,
  characterDestinationOffset: {
    x: -8.72,
    z: 3.02,
  },
  characterFacingDistance: 0.7,
  hitMarker: {
    borderColor: SCENE_TOKEN_COLOR.bgFloating,
    cellColor: SCENE_TOKEN_COLOR.blue500,
    cellOpacity: 0.55,
    centerColor: SCENE_TOKEN_COLOR.blue600,
    centerScale: 0.78,
    layerGap: 0.002,
    ring: {
      color: SCENE_TOKEN_COLOR.blue600,
      inner: { radiusCells: 1.16, widthCells: 0.18 },
      outer: { radiusCells: 1.56, widthCells: 0.08 },
    },
    yOffset: 0.01,
  },
} as const;
