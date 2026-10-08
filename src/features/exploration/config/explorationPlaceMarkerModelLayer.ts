import { EXPLORATION_MAP_BEARING } from "./explorationMapConfig";

const DEGREES_TO_RADIANS = Math.PI / 180;

export const EXPLORATION_PLACE_MARKER_MODEL_LAYER_ID = "smart-seoul-theme-place-marker-models";
export const PLACE_MARKER_MODEL_HEIGHT_METERS = 30;
export const PLACE_MARKER_MODEL_YAW_RADIANS = -EXPLORATION_MAP_BEARING * DEGREES_TO_RADIANS;
export const PLACE_MARKER_MODEL_REVEALED_TINT = 0x9a9a9a;
export const PLACE_MARKER_MODEL_DEFAULT_TINT = 0xffffff;
