import * as THREE from "three";

export const ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG = {
  activationDurationMs: 1200,
  bounceCount: 5,
  bounceDurationMs: 1800,
  bounceMaxHeight: 2.6,
  chargeMaxDurationMs: 1400,
  jumpMapPosition: {
    x: 5.8,
    z: 6.8,
  },
  jumpStartPoint: {
    x: 0,
    y: -3.95,
  },
  jumpTokenHeightRatio: 0.18,
  mapPadding: 0.36,
  mapRiseHeight: 0.52,
  mapSize: {
    depth: 6.1,
    width: 8.1,
  },
  mapThickness: 0.34,
  maxThrowDistance: 5.85,
  minThrowDistance: 1.6,
  triggerRadius: 0.82,
} as const;

export type EntryExplorationDistrictSelectionCameraPreset = {
  durationMs: number;
  lookAtOffset: THREE.Vector3;
  positionOffset: THREE.Vector3;
  zoom: number;
};

export type EntryExplorationDistrictSelectionCameraTarget = {
  durationMs: number;
  toLookAt: THREE.Vector3;
  toPosition: THREE.Vector3;
  toZoom: number;
};

export type EntryExplorationDistrictSelectionRootPosition = {
  x: number;
  y: number;
  z: number;
};

export const ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET = {
  durationMs: ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.activationDurationMs,
  lookAtOffset: new THREE.Vector3(1.5, 0.62, 0.6),
  positionOffset: new THREE.Vector3(4.8, 7.2, 5.2),
  zoom: 1.55,
} as const satisfies EntryExplorationDistrictSelectionCameraPreset;

export const ENTRY_EXPLORATION_DISTRICT_SELECTION_SCENE_PRESET = {
  control: {
    accentColor: 0xf36f32,
    aimLineHeight: 0.14,
    aimLineInitialHeight: 0.11,
    aimLineOpacity: 0.88,
    aimLineWidth: 2,
    baseRing: {
      color: 0x9aa09d,
      innerRadius: 0.74,
      opacity: 0.42,
      outerRadius: 0.8,
      y: 0.1,
    },
    chargeRing: {
      innerRadius: 0.66,
      minimumRatio: 0.03,
      opacity: 0.86,
      outerRadius: 0.78,
      y: 0.12,
    },
    ringSegments: 64,
    secondaryColor: 0xf5c542,
  },
  jump: {
    characterSurfaceClearance: 0.04,
    heightChargeScale: {
      base: 0.72,
      multiplier: 0.55,
    },
    shadow: {
      baseColor: 0x1a201c,
      baseOpacity: 0.18,
      contactColor: 0xf36f32,
      contactOpacityBonus: 0.24,
      contactScaleBonus: 0.32,
      defaultOpacity: 0.22,
      heightScaleFactor: 0.12,
      minScale: 0.42,
      radius: 0.42,
      segments: 32,
      surfaceOffset: 0.028,
    },
    squashIntensity: 0.16,
  },
  map: {
    boundaryLineHeightOffset: 0.026,
    extrude: {
      bevelSegments: 1,
      bevelSize: 0.028,
      bevelThickness: 0.025,
    },
    gradientColors: {
      end: new THREE.Color(0xc8d2d0),
      middle: new THREE.Color(0xe5ece9),
      start: new THREE.Color(0xfbfcfa),
    },
    gradientMidpoint: 0.5,
    interactionPlaneOffset: 0.08,
    lineColor: 0x9aa09d,
    lineOpacity: 0.7,
    selectedColor: 0xd91f5c,
    selectedEmissiveColor: 0x4f071f,
    sideColor: 0xc9cecc,
    sideMaterial: {
      metalness: 0.08,
      roughness: 0.74,
    },
    surfaceOffset: 0.012,
    surfaceHeightOffset: 0.05,
    topMaterial: {
      color: 0xffffff,
      emissive: 0x000000,
      metalness: 0.12,
      roughness: 0.55,
    },
  },
} as const;

export function createEntryExplorationDistrictSelectionCameraTarget(
  rootPosition: EntryExplorationDistrictSelectionRootPosition,
  preset: EntryExplorationDistrictSelectionCameraPreset = ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET
): EntryExplorationDistrictSelectionCameraTarget {
  const rootVector = new THREE.Vector3(rootPosition.x, rootPosition.y, rootPosition.z);

  return {
    durationMs: preset.durationMs,
    toLookAt: rootVector.clone().add(preset.lookAtOffset),
    toPosition: rootVector.clone().add(preset.positionOffset),
    toZoom: preset.zoom,
  };
}
