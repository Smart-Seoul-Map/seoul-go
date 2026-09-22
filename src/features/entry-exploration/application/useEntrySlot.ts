import { useCallback, useEffect, useRef, useState } from "react";

import {
  createEntrySlotInteraction,
  type EntrySlotInteraction,
  type EntrySlotState,
  type EntrySlotViewportBounds,
} from "./entrySlotInteraction";

export function useEntrySlot() {
  const controllerRef = useRef<EntrySlotInteraction | null>(null);
  const [state, setState] = useState<EntrySlotState>({ status: "closed" });
  const createSlotInteractionControllers = useCallback(() => {
    const controller = createEntrySlotInteraction({ onStateChange: setState });
    controllerRef.current = controller;

    return [controller];
  }, []);
  const onSpin = useCallback(() => {
    controllerRef.current?.spin(performance.now());
  }, []);
  const onClose = useCallback(() => {
    controllerRef.current?.deactivate();
  }, []);
  const onRetryLoad = useCallback(() => {
    controllerRef.current?.retryLoad();
  }, []);
  const onViewportBoundsChange = useCallback((bounds: EntrySlotViewportBounds | null) => {
    controllerRef.current?.setViewportBounds(bounds);
  }, []);
  useEffect(
    () => () => {
      controllerRef.current = null;
    },
    []
  );

  return {
    createSlotInteractionControllers,
    state,
    onSpin,
    onClose,
    onRetryLoad,
    onViewportBoundsChange,
  };
}
