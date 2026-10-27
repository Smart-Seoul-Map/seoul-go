export const ENTRY_EXPLORATION_DART_ROULETTE_CONFIG = {
  board: {
    rippleDelayPerCellMs: 22,
    rippleRadiusCells: 9,
    tileGapRatio: 0.06,
  },
  camera: {
    contentCenterScreenRatio: 0.5,
    heightUsageRatio: 0.8,
    maxZoom: 2.5,
    widthUsageRatio: 0.94,
  },
  confetti: [
    { tone: "glow", xPx: 0, yPx: -110, rotateDeg: 240 },
    { tone: "mint", xPx: 52, yPx: -96, rotateDeg: -200 },
    { tone: "pink", xPx: 92, yPx: -58, rotateDeg: 240 },
    { tone: "blue", xPx: 110, yPx: -8, rotateDeg: -260 },
    { tone: "pop", xPx: 96, yPx: 40, rotateDeg: 240 },
    { tone: "mint", xPx: 54, yPx: 72, rotateDeg: -220 },
    { tone: "pink", xPx: 6, yPx: 84, rotateDeg: 240 },
    { tone: "blue", xPx: -46, yPx: 74, rotateDeg: -280 },
    { tone: "glow", xPx: -90, yPx: 44, rotateDeg: 240 },
    { tone: "mint", xPx: -112, yPx: -4, rotateDeg: -240 },
    { tone: "pink", xPx: -98, yPx: -54, rotateDeg: 240 },
    { tone: "blue", xPx: -58, yPx: -94, rotateDeg: -210 },
    { tone: "pop", xPx: 28, yPx: -132, rotateDeg: 240 },
    { tone: "glow", xPx: -24, yPx: -128, rotateDeg: -250 },
  ],
  // 칸 열 위치(판 너비 비율)가 이 값보다 왼쪽·오른쪽 끝에 가까우면 정보 박스를 그쪽으로 붙인다.
  infoBox: {
    edgeColumnRatio: 0.3,
  },
  steps: {
    count: 19,
    fastCount: 10,
    fastDelayMs: 75,
    settleDelayMs: 200,
    slowdownBaseMs: 24,
    slowdownExponent: 1.65,
    winHoldMs: 850,
  },
  vibration: {
    tickMs: 8,
    winPattern: [30, 40, 90],
  },
} as const;
