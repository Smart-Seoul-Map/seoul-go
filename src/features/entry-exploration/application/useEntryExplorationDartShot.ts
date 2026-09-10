import { useCallback, useRef, useState } from "react";

import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";

export type EntryExplorationDartShotViewModel = {
  isGuideVisible: boolean;
  isTargetHovered: boolean;
  landedResult: EntryExplorationDartThrowResult | null;
  shotResult: EntryExplorationDartThrowResult | null;
};

type EntryExplorationDartShotHookResult = {
  dartShot: EntryExplorationDartShotViewModel;
  onDartTargetHoverChange: (isTargetHovered: boolean) => void;
  onDartThrowResult: (result: EntryExplorationDartThrowResult) => void;
  onDartViewActiveChange: (isActive: boolean) => void;
  onDartViewControlsReady: (controls: EntryExplorationDartViewControls) => void;
  onFlightEnd: () => void;
};

export function useEntryExplorationDartShot(): EntryExplorationDartShotHookResult {
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [isTargetHovered, setIsTargetHovered] = useState(false);
  const [shotResult, setShotResult] = useState<EntryExplorationDartThrowResult | null>(null);
  const [landedResult, setLandedResult] = useState<EntryExplorationDartThrowResult | null>(null);
  const shotResultRef = useRef<EntryExplorationDartThrowResult | null>(null);
  const viewControlsRef = useRef<EntryExplorationDartViewControls | null>(null);

  const onDartViewControlsReady = useCallback((controls: EntryExplorationDartViewControls) => {
    viewControlsRef.current = controls;
  }, []);

  const onDartViewActiveChange = useCallback((isActive: boolean) => {
    setIsGuideVisible(isActive);

    if (isActive) {
      return;
    }

    setIsTargetHovered(false);
    setShotResult(null);
    setLandedResult(null);
    viewControlsRef.current?.setHitCell(null);
  }, []);

  const onDartThrowResult = useCallback((result: EntryExplorationDartThrowResult) => {
    shotResultRef.current = result;
    setShotResult(result);
  }, []);

  const onFlightEnd = useCallback(() => {
    const landed = shotResultRef.current;

    setLandedResult(landed);
    viewControlsRef.current?.setHitCell(landed?.cell ?? null);
  }, []);

  return {
    dartShot: { isGuideVisible, isTargetHovered, landedResult, shotResult },
    onDartTargetHoverChange: setIsTargetHovered,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
    onFlightEnd,
  };
}
