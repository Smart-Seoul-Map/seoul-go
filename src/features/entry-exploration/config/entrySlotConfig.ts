export const ENTRY_SLOT_CONFIG = {
  modelUrl: "/models/slot_v1.glb",
  height: 3.6,
  rotationY: -Math.PI / 4,
  approachOffset: 2.2,
  triggerRadius: 1.1,
  stopFeedbackDistance: 0.018,
  lever: {
    name: "slot_lever",
    pullAngle: -Math.PI / 3,
    pullMs: 350,
    holdMs: 100,
    returnMs: 300,
  },
  reelNames: ["slot_number_2", "slot_logo", "slot_number_1"],
} as const;
