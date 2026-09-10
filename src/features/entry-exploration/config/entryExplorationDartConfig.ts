export const ENTRY_EXPLORATION_DART_CONFIG = {
  clickHint: {
    offsetFromTip: { x: -68, y: -42 },
    width: 118,
  },
  crosshairSize: 48,
  flight: {
    arcHeightRatio: 0.32,
    durationMs: 620,
  },
  idleArrow: {
    aimRotationRangeDegrees: 18,
    aimTimeConstantMs: 110,
    aimSpanDegrees: 42,
    restRatio: { x: 0.22, y: 1.1 },
    restRotationDegrees: 3,
    width: 300,
  },
  sprite: {
    aspectRatio: 592 / 600,
    nockRatio: { x: 0.1133, y: 0.853 },
    textureRotationDegrees: -43.6,
    tipRatio: { x: 0.99, y: 0.0068 },
  },
} as const;
