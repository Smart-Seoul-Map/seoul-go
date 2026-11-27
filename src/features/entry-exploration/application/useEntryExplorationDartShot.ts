import { useCallback, useEffect, useRef, useState } from "react";

import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import type { SeoulGridCell } from "../domain/seoulGridNumber";
import type {
  EntryExplorationDartRouletteHighlight,
  EntryExplorationDartRouletteLayout,
  EntryExplorationDartRouletteWin,
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
  EntryExplorationDartViewportRect,
} from "./entryExplorationSeoulTileMapViewInteraction";

export type EntryExplorationDartRouletteBoardLayout = Omit<
  EntryExplorationDartRouletteLayout,
  "mapRect"
>;

export type EntryExplorationDartRouletteBoardState = {
  activeCell: SeoulGridCell | null;
  layout: EntryExplorationDartRouletteBoardLayout | null;
  step: number;
  win: EntryExplorationDartRouletteWin | null;
};

// 카메라 이동 중 매 프레임 바뀌는 지도 위치는 React 상태를 거치지 않고 구독으로 전달한다.
export type EntryExplorationDartRouletteMapRectStore = {
  getSnapshot: () => EntryExplorationDartViewportRect | null;
  subscribe: (listener: (mapRect: EntryExplorationDartViewportRect) => void) => () => void;
};

export type EntryExplorationDartShotViewModel = {
  isGuideVisible: boolean;
  isRouletteReady: boolean;
  isRouletteStarted: boolean;
  isTargetHovered: boolean;
  landedResult: EntryExplorationDartThrowResult | null;
  rouletteBoard: EntryExplorationDartRouletteBoardState;
  shotResult: EntryExplorationDartThrowResult | null;
};

type EntryExplorationDartShotHookResult = {
  dartShot: EntryExplorationDartShotViewModel;
  onActiveChange: (isActive: boolean) => void;
  onArrowThrow: () => void;
  onCameraSettled: () => void;
  onControlsReady: (controls: EntryExplorationDartViewControls) => void;
  onDartThrowResult: (result: EntryExplorationDartThrowResult) => void;
  onFlightEnd: () => void;
  onRetryThrow: () => void;
  onRouletteHighlight: (highlight: EntryExplorationDartRouletteHighlight) => void;
  onRouletteLayoutChange: (layout: EntryExplorationDartRouletteLayout) => void;
  onRouletteStart: () => void;
  onRouletteThrowResult: (result: EntryExplorationDartThrowResult) => void;
  onRouletteWin: (win: EntryExplorationDartRouletteWin) => void;
  onTargetHoverChange: (isTargetHovered: boolean) => void;
  requestDartView: () => void;
  rouletteMapRectStore: EntryExplorationDartRouletteMapRectStore;
};

const EMPTY_ROULETTE_BOARD: EntryExplorationDartRouletteBoardState = {
  activeCell: null,
  layout: null,
  step: 0,
  win: null,
};

const { steps, vibration } = ENTRY_EXPLORATION_DART_ROULETTE_CONFIG;

export function useEntryExplorationDartShot(): EntryExplorationDartShotHookResult {
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [isRouletteReady, setIsRouletteReady] = useState(false);
  const [isRouletteStarted, setIsRouletteStarted] = useState(false);
  const [isTargetHovered, setIsTargetHovered] = useState(false);
  const [shotResult, setShotResult] = useState<EntryExplorationDartThrowResult | null>(null);
  const [landedResult, setLandedResult] = useState<EntryExplorationDartThrowResult | null>(null);
  const [rouletteBoard, setRouletteBoard] = useState(EMPTY_ROULETTE_BOARD);
  const [rouletteMapRectStore] = useState(createRouletteMapRectStore);
  const rouletteBoardLayoutRef = useRef<EntryExplorationDartRouletteBoardLayout | null>(null);
  const shotResultRef = useRef<EntryExplorationDartThrowResult | null>(null);
  const arrowWinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewControlsRef = useRef<EntryExplorationDartViewControls | null>(null);

  const cancelArrowWin = useCallback(() => {
    if (arrowWinTimerRef.current !== null) {
      clearTimeout(arrowWinTimerRef.current);
    }

    arrowWinTimerRef.current = null;
  }, []);

  useEffect(() => cancelArrowWin, [cancelArrowWin]);

  const onControlsReady = useCallback((controls: EntryExplorationDartViewControls) => {
    viewControlsRef.current = controls;
  }, []);

  const onActiveChange = useCallback(
    (isActive: boolean) => {
      setIsGuideVisible(isActive);

      if (isActive) {
        return;
      }

      cancelArrowWin();
      shotResultRef.current = null;
      setIsTargetHovered(false);
      setIsRouletteReady(false);
      setIsRouletteStarted(false);
      setRouletteBoard(EMPTY_ROULETTE_BOARD);
      rouletteBoardLayoutRef.current = null;
      setShotResult(null);
      setLandedResult(null);
    },
    [cancelArrowWin]
  );

  const onDartThrowResult = useCallback((result: EntryExplorationDartThrowResult) => {
    shotResultRef.current = result;
    setShotResult(result);
  }, []);

  const onRouletteThrowResult = useCallback(
    (result: EntryExplorationDartThrowResult) => {
      onDartThrowResult(result);
      setLandedResult(result);
    },
    [onDartThrowResult]
  );

  const onArrowThrow = useCallback(() => {
    viewControlsRef.current?.throwAtRandomCell();
  }, []);

  const onCameraSettled = useCallback(() => {
    setIsRouletteReady(true);
  }, []);

  const onRouletteLayoutChange = useCallback(
    ({ mapRect, restMapRect, selectableCells }: EntryExplorationDartRouletteLayout) => {
      rouletteMapRectStore.publish(mapRect);

      const previous = rouletteBoardLayoutRef.current;

      if (previous?.restMapRect === restMapRect && previous.selectableCells === selectableCells) {
        return;
      }

      const layout = { restMapRect, selectableCells };

      rouletteBoardLayoutRef.current = layout;
      setRouletteBoard((board) => ({ ...board, layout }));
    },
    [rouletteMapRectStore]
  );

  const onRouletteHighlight = useCallback(
    ({ cell, step }: EntryExplorationDartRouletteHighlight) => {
      setRouletteBoard((board) => ({ ...board, activeCell: cell, step, win: null }));

      if (step >= steps.fastCount) {
        navigator.vibrate?.(vibration.tickMs);
      }
    },
    []
  );

  const onRouletteWin = useCallback((win: EntryExplorationDartRouletteWin) => {
    setRouletteBoard((board) => ({ ...board, activeCell: null, win }));
    navigator.vibrate?.([...vibration.winPattern]);
  }, []);

  const onRouletteStart = useCallback(() => {
    const hasStarted = viewControlsRef.current?.startRoulette() ?? false;

    setIsRouletteStarted(hasStarted);
  }, []);

  const onRetryThrow = useCallback(() => {
    cancelArrowWin();
    shotResultRef.current = null;
    setShotResult(null);
    setLandedResult(null);
    setIsRouletteStarted(false);
    setRouletteBoard((board) => ({ ...EMPTY_ROULETTE_BOARD, layout: board.layout }));
    viewControlsRef.current?.resetThrow();
  }, [cancelArrowWin]);

  const onFlightEnd = useCallback(() => {
    const landed = shotResultRef.current;

    if (!landed || arrowWinTimerRef.current !== null) {
      return;
    }

    onRouletteWin({ cell: landed.cell, gridNumber: landed.gridNumber });
    arrowWinTimerRef.current = setTimeout(() => {
      arrowWinTimerRef.current = null;
      setLandedResult(landed);
    }, steps.winHoldMs);
  }, [onRouletteWin]);

  const requestDartView = useCallback(() => {
    viewControlsRef.current?.requestApproach();
  }, []);

  return {
    dartShot: {
      isGuideVisible,
      isRouletteReady,
      isRouletteStarted,
      isTargetHovered,
      landedResult,
      rouletteBoard,
      shotResult,
    },
    onActiveChange,
    onArrowThrow,
    onCameraSettled,
    onControlsReady,
    onDartThrowResult,
    onFlightEnd,
    onRetryThrow,
    onRouletteHighlight,
    onRouletteLayoutChange,
    onRouletteStart,
    onRouletteThrowResult,
    onRouletteWin,
    onTargetHoverChange: setIsTargetHovered,
    requestDartView,
    rouletteMapRectStore,
  };
}

function createRouletteMapRectStore(): EntryExplorationDartRouletteMapRectStore & {
  publish: (mapRect: EntryExplorationDartViewportRect) => void;
} {
  const listeners = new Set<(mapRect: EntryExplorationDartViewportRect) => void>();
  let snapshot: EntryExplorationDartViewportRect | null = null;

  return {
    getSnapshot: () => snapshot,
    publish: (mapRect) => {
      snapshot = mapRect;
      listeners.forEach((listener) => listener(mapRect));
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
