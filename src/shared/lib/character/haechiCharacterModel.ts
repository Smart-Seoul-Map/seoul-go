export const HAECHI_CHARACTER_MODEL_MANIFEST = {
  mesh: "/models/haechi_v1.glb",
  animations: {
    idlePrimary: "/models/haechi_idle_01_v1.glb",
    idleSecondary: "/models/haechi_idle_02_v1.glb",
    walk: "/models/haechi_walk_v1.glb",
  },
} as const;

export const HAECHI_CHARACTER_ANIMATION_TIME_SCALE = {
  idlePrimary: 1,
  idleSecondary: 1,
  walk: 1.5,
} as const satisfies Record<HaechiCharacterModelKey, number>;

export type HaechiCharacterModelKey = keyof typeof HAECHI_CHARACTER_MODEL_MANIFEST.animations;
