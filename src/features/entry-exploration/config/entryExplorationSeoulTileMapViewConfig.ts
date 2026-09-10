import { ENTRY_EXPLORATION_SCENE_CONFIG } from "./entryExplorationSceneConfig";

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
  cameraZoom: 1.25,
  characterDestinationOffset: {
    x: -8.72,
    z: 3.02,
  },
  characterFacingDistance: 0.7,
  hitCellHighlight: {
    color: 0xff2e94,
    opacity: 0.55,
    yOffset: 0.01,
  },
} as const;
