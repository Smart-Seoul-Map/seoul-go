import { useCallback, useRef, useState } from "react";

import { track } from "@shared/lib/analytics/analytics";

import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

export function useEntryExplorationIntro() {
  const [hasStarted, setHasStarted] = useState(false);
  const deactivateActiveInteractionRef = useRef<(() => void) | null>(null);

  const handleSceneControlsReady = useCallback(
    (controls: EntryExplorationThreeSceneControls | null) => {
      deactivateActiveInteractionRef.current = controls?.deactivateActiveInteraction ?? null;
    },
    []
  );

  const handleIntroStart = useCallback(() => {
    track({ name: "entry_intro_start" });
    setHasStarted(true);
  }, []);

  const handleDeactivateActiveInteraction = useCallback((): void => {
    deactivateActiveInteractionRef.current?.();
  }, []);

  return {
    hasStarted,
    handleIntroStart,
    handleSceneControlsReady,
    handleDeactivateActiveInteraction,
  };
}
