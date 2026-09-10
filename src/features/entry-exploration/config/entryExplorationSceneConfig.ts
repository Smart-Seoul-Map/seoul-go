import {
  HAECHI_CHARACTER_ANIMATION_TIME_SCALE,
  HAECHI_CHARACTER_MODEL_MANIFEST,
} from "@shared/lib/character/haechiCharacterModel";

import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "./entryExplorationAssets";

export const ENTRY_EXPLORATION_FLOOR_TEXTURE_URL = ENTRY_EXPLORATION_TEXTURE_ASSETS.floor.src;

export const ENTRY_EXPLORATION_CHARACTER_MODEL_MANIFEST = HAECHI_CHARACTER_MODEL_MANIFEST;
export const ENTRY_EXPLORATION_CHARACTER_ANIMATION_TIME_SCALE =
  HAECHI_CHARACTER_ANIMATION_TIME_SCALE;

export const ENTRY_EXPLORATION_SCENE_CONFIG = {
  arrivalRadius: 0.35,
  cameraOffset: {
    x: 11,
    y: 13,
    z: 11,
  },
  cameraTransitionDurationMs: 900,
  cameraViewSize: 19,
  characterHeight: 2.3,
  characterSpeedPerSecond: 7,
  floorSize: 1000,
  floorTextureRepeat: 150,
  intro: {
    camera: {
      focusPosition: {
        x: -0.9,
        z: -0.9,
      },
      offset: {
        x: 11,
        y: 13,
        z: 11,
      },
      transitionDurationMs: 1_600,
      zoom: 2.3,
    },
    characterSpawnPosition: {
      x: -14,
      z: -14,
    },
    targetPosition: {
      x: 0,
      z: 3.8, // [수정] 피그마 시안에 맞춘 버튼 위치 (기존 0.7에서 3.8로 이동)
    },
  },
  maxFrameDeltaSeconds: 0.04,
  shadowCameraSize: 1000,
} as const;
