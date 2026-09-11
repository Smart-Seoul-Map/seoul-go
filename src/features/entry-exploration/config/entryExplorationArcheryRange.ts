export const ENTRY_EXPLORATION_ARCHERY_RANGE = {
  position: {
    x: 30.25,
    z: 20,
  },
  props: {
    arrow: {
      groundSize: 2.2,
      modelUrl: "/models/arrow_v2.glb",
      offset: { x: -0.03, z: 2.38 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0.21 },
    },
    bow: {
      groundSize: 2.6,
      modelUrl: "/models/bow_v1.glb",
      offset: { x: -1.03, z: -0.12 },
      rotation: { x: -Math.PI / 2, y: 0, z: (Math.PI * 3) / 4 },
    },
    targetBoard: {
      atlasKey: "targetBoard",
      offset: { x: 1.07, z: -2.27 },
      width: 2.3,
      yOffset: 0.06,
    },
  },
  triggerRadius: 4.2,
} as const;
