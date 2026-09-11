import { useCallback, useState } from "react";

import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

export function useEntryExplorationIntro() {
  const [startIntro, setStartIntro] = useState<(() => boolean) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleSceneControlsReady = useCallback(
    (controls: EntryExplorationThreeSceneControls | null) => {
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

  return { isReady, isVisible, handleStart, handleSceneControlsReady };
}
