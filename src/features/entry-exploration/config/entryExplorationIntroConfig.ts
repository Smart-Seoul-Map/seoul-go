export const ENTRY_EXPLORATION_INTRO_CONFIG = {
  button: {
    depth: 1.25,
    position: {
      x: 0.7,
      z: 0.7,
    },
    width: 3.6,
    yOffset: 0.07,
  },
  camera: {
    finalFocusPosition: {
      x: 0.7,
      z: 0.7,
    },
    focusPosition: {
      x: -0.9,
      z: -0.9,
    },
    offset: {
      x: 2.2,
      y: 24,
      z: 2.2,
    },
    transitionDurationMs: 1_600,
    zoom: 2.3,
  },
  characterSpawnPosition: {
    x: -14,
    z: -14,
  },
  characterTargetPosition: {
    x: 0.7,
    z: 0.7,
  },
  copy: {
    depth: 2.2,
    position: {
      x: -0.9,
      z: -0.9,
    },
    width: 9.6,
    yOffset: 0.06,
  },
  description: [
    "서울 지도를 직접 걸으며 새로운 장소를 발견해 보세요.",
    "가고 싶은 곳을 클릭하면 캐릭터가 이동해요.",
  ],
  logo: {
    depth: 3.4,
    position: {
      x: -2.8,
      z: -2.8,
    },
    width: 6.8,
    yOffset: 0.05,
  },
} as const;
