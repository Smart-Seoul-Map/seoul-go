export const CHUNSIK_CHARACTER_MODEL_MANIFEST = {
  mesh: "/models/chunsik_v1.glb",
  animations: {
    idlePrimary: "/models/chunsik_idle_01_v1.glb",
    idleSecondary: "/models/chunsik_idle_02_v1.glb",
    run: "/models/chunsik_run_v1.glb",
  },
} as const;

export const CHUNSIK_CHARACTER_ANIMATION_TIME_SCALE = {
  idlePrimary: 1,
  idleSecondary: 1,
  run: 1.6,
} as const satisfies Record<ChunsikCharacterModelKey, number>;

export type ChunsikCharacterModelKey = keyof typeof CHUNSIK_CHARACTER_MODEL_MANIFEST.animations;
