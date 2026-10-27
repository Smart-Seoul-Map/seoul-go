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
