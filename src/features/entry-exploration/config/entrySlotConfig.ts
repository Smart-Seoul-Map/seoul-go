export const ENTRY_SLOT_CONFIG = {
  modelUrl: "/models/slot_v1.glb",
  height: 3.6,
  position: { x: -0.5, z: 7.5 },
  rotationY: -Math.PI / 4,
  loadTimeoutMs: 10_000,
  selection: { width: 5.6, height: 2.7, frontOffset: 0.15 },
  presentation: { coverMs: 240, revealMs: 360 },
  lever: {
    name: "slot_lever",
    pullAngle: -Math.PI / 3,
    pullMs: 350,
    holdMs: 100,
    returnMs: 300,
  },
  camera: {
    distance: 12,
    widthUsage: 0.78,
    heightUsage: 0.58,
    contentCenterY: 0.42,
    viewportGapRatio: 0.05,
  },
  reelNames: ["slot_number_2", "slot_logo", "slot_number_1"],
} as const;
