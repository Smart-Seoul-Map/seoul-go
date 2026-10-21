import { useCallback, useRef, useState } from "react";

import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";

export type EntryExplorationDartViewKind = "arrow" | "roulette";

export type EntryExplorationDartShotViewModel = {
  isGuideVisible: boolean;
  isRouletteStarted: boolean;
  isTargetHovered: boolean;
  landedResult: EntryExplorationDartThrowResult | null;
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
  onRouletteStart: () => void;
  onRouletteThrowResult: (result: EntryExplorationDartThrowResult) => void;
  onRouletteViewActiveChange: (isActive: boolean) => void;
  onRouletteViewControlsReady: (controls: EntryExplorationDartViewControls) => void;
  requestDartView: () => void;
};

export function useEntryExplorationDartShot(): EntryExplorationDartShotHookResult {
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [isRouletteStarted, setIsRouletteStarted] = useState(false);
  const [isTargetHovered, setIsTargetHovered] = useState(false);
  const [shotResult, setShotResult] = useState<EntryExplorationDartThrowResult | null>(null);
  const [landedResult, setLandedResult] = useState<EntryExplorationDartThrowResult | null>(null);
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
      setIsRouletteStarted(false);
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
      viewControlsRef.current.roulette?.setHitCell(result.cell);
    },
    [onDartThrowResult]
  );

  const onArrowThrow = useCallback(() => {
    viewControlsRef.current.arrow?.throwAtRandomCell();
  }, []);

  const onRouletteStart = useCallback(() => {
    setIsRouletteStarted(true);
    viewControlsRef.current.roulette?.startRoulette();
  }, []);

  const onRequestRouletteView = useCallback(() => {
    viewControlsRef.current.roulette?.requestApproach();
  }, []);

  const onRetryThrow = useCallback(() => {
    shotResultRef.current = null;
    setShotResult(null);
    setLandedResult(null);
    setIsRouletteStarted(false);
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
      isRouletteStarted,
      isTargetHovered,
      landedResult,
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
    onRouletteStart,
    onRouletteThrowResult,
    onRouletteViewActiveChange,
    onRouletteViewControlsReady,
    requestDartView,
  };
}
