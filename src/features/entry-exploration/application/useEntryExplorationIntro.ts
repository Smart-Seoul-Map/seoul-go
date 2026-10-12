import { useCallback, useRef, useState } from "react";

import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

export function useEntryExplorationIntro() {
  const [startIntro, setStartIntro] = useState<(() => boolean) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const deactivateActiveInteractionRef = useRef<(() => void) | null>(null);

  const handleSceneControlsReady = useCallback(
    (controls: EntryExplorationThreeSceneControls | null) => {
      deactivateActiveInteractionRef.current = controls?.deactivateActiveInteraction ?? null;
      setStartIntro(() => controls?.startIntro ?? null);
      setIsReady(controls?.isIntroReady ?? false);
    },
    []
  );

  const handleStart = (): void => {
    if (startIntro?.()) {
      setIsVisible(false);
    }
  };

  const handleDeactivateActiveInteraction = useCallback((): void => {
    deactivateActiveInteractionRef.current?.();
  }, []);

  return {
    isReady,
    isVisible,
    handleStart,
    handleSceneControlsReady,
    handleDeactivateActiveInteraction,
  };
}
