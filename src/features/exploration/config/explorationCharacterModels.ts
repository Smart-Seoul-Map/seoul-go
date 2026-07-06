export const CHARACTER_MODEL_MANIFEST = {
  // 시각적인 메쉬 데이터
  mesh: "/models/chunsik_v1.glb",

  // 상태별 애니메이션 데이터
  animations: {
    idlePrimary: "/models/chunsik_idle_01_v1.glb",
    idleSecondary: "/models/chunsik_idle_02_v1.glb",
    run: "/models/chunsik_run_v1.glb",
  },
} as const;

// 필요한 경우 타입도 구조에 맞춰 업데이트합니다.
export type CharacterModelKey = keyof typeof CHARACTER_MODEL_MANIFEST.animations;
