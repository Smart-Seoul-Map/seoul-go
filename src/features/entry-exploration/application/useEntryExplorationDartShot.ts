import { useCallback, useRef, useState } from "react";

import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import type { SeoulGridCell } from "../domain/seoulGridNumber";
import type {
  EntryExplorationDartRouletteHighlight,
  EntryExplorationDartRouletteLayout,
  EntryExplorationDartRouletteWin,
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
  EntryExplorationDartViewKind,
} from "./entryExplorationSeoulTileMapViewInteraction";

export type EntryExplorationDartRouletteBoardState = {
  activeCell: SeoulGridCell | null;
  layout: EntryExplorationDartRouletteLayout | null;
  step: number;
  win: EntryExplorationDartRouletteWin | null;
};

export type EntryExplorationDartShotViewModel = {
  isGuideVisible: boolean;
  isRouletteReady: boolean;
  isRouletteStarted: boolean;
  isTargetHovered: boolean;
  landedResult: EntryExplorationDartThrowResult | null;
  rouletteBoard: EntryExplorationDartRouletteBoardState;
  shotResult: EntryExplorationDartThrowResult | null;
  viewKind: EntryExplorationDartViewKind;
};

type EntryExplorationDartShotHookResult = {
  dartShot: EntryExplorationDartShotViewModel;
  onArrowThrow: () => void;
  onDartTargetHoverChange: (isTargetHovered: boolean) => void;
  onDartThrowResult: (result: EntryExplorationDartThrowResult) => void;
  onDartViewActiveChange: (isActive: boolean) => void;
  onDartViewControlsReady: (controls: EntryExplorationDartViewControls) => void;
  onFlightEnd: () => void;
  onRequestRouletteView: () => void;
  onRetryThrow: () => void;
  onRouletteCameraSettled: () => void;
  onRouletteHighlight: (highlight: EntryExplorationDartRouletteHighlight) => void;
  onRouletteLayoutChange: (layout: EntryExplorationDartRouletteLayout) => void;
  onRouletteStart: () => void;
  onRouletteThrowResult: (result: EntryExplorationDartThrowResult) => void;
  onRouletteViewActiveChange: (isActive: boolean) => void;
  onRouletteViewControlsReady: (controls: EntryExplorationDartViewControls) => void;
  onRouletteWin: (win: EntryExplorationDartRouletteWin) => void;
  requestDartView: () => void;
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
  const [viewKind, setViewKind] = useState<EntryExplorationDartViewKind>("arrow");
  const shotResultRef = useRef<EntryExplorationDartThrowResult | null>(null);
  const viewKindRef = useRef<EntryExplorationDartViewKind>("arrow");
  const viewControlsRef = useRef<
    Record<EntryExplorationDartViewKind, EntryExplorationDartViewControls | null>
  >({
    arrow: null,
    roulette: null,
  });

  const onDartViewControlsReady = useCallback((controls: EntryExplorationDartViewControls) => {
    viewControlsRef.current.arrow = controls;
  }, []);

  const onRouletteViewControlsReady = useCallback((controls: EntryExplorationDartViewControls) => {
    viewControlsRef.current.roulette = controls;
  }, []);

  const handleViewActiveChange = useCallback(
    (kind: EntryExplorationDartViewKind, isActive: boolean) => {
      setIsGuideVisible(isActive);

      if (isActive) {
        viewKindRef.current = kind;
        setViewKind(kind);

        return;
      }

      setIsTargetHovered(false);
      setIsRouletteReady(false);
      setIsRouletteStarted(false);
      setRouletteBoard(EMPTY_ROULETTE_BOARD);
      setShotResult(null);
      setLandedResult(null);
      viewControlsRef.current[kind]?.setHitCell(null);
    },
    []
  );

  const onDartViewActiveChange = useCallback(
    (isActive: boolean) => handleViewActiveChange("arrow", isActive),
    [handleViewActiveChange]
  );

  const onRouletteViewActiveChange = useCallback(
    (isActive: boolean) => handleViewActiveChange("roulette", isActive),
    [handleViewActiveChange]
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
    viewControlsRef.current.arrow?.throwAtRandomCell();
  }, []);

  const onRouletteCameraSettled = useCallback(() => {
    setIsRouletteReady(true);
  }, []);

  const onRouletteLayoutChange = useCallback((layout: EntryExplorationDartRouletteLayout) => {
    setRouletteBoard((board) => ({ ...board, layout }));
  }, []);

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
    const hasStarted = viewControlsRef.current.roulette?.startRoulette() ?? false;

    setIsRouletteStarted(hasStarted);
  }, []);

  const onRequestRouletteView = useCallback(() => {
    viewControlsRef.current.roulette?.requestApproach();
  }, []);

  const onRetryThrow = useCallback(() => {
    shotResultRef.current = null;
    setShotResult(null);
    setLandedResult(null);
    setIsRouletteStarted(false);
    setRouletteBoard((board) => ({ ...EMPTY_ROULETTE_BOARD, layout: board.layout }));
    viewControlsRef.current[viewKindRef.current]?.resetThrow();
  }, []);

  const onFlightEnd = useCallback(() => {
    const landed = shotResultRef.current;

    setLandedResult(landed);
    viewControlsRef.current.arrow?.setHitCell(landed?.cell ?? null);
  }, []);

  const requestDartView = useCallback(() => {
    viewControlsRef.current.arrow?.requestApproach();
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
      viewKind,
    },
    onArrowThrow,
    onDartTargetHoverChange: setIsTargetHovered,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
    onFlightEnd,
    onRequestRouletteView,
    onRetryThrow,
    onRouletteCameraSettled,
    onRouletteHighlight,
    onRouletteLayoutChange,
    onRouletteStart,
    onRouletteThrowResult,
    onRouletteViewActiveChange,
    onRouletteViewControlsReady,
    onRouletteWin,
    requestDartView,
  };
}
