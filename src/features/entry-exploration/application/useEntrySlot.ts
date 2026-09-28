import { useCallback, useEffect, useRef, useState } from "react";

import type { EntryNumberReward } from "../domain/entryNumberReward";
import type { SlotDigits } from "../domain/entrySlotSpin";

import {
  createEntrySlotInteraction,
  type EntrySlotInteraction,
  type EntrySlotState,
  type EntrySlotViewportBounds,
} from "./entrySlotInteraction";

type EntrySlotCallbacks = {
  onRewardRevealed: (placeId: string) => void;
};

function getRewardDigits(reward: EntryNumberReward): SlotDigits {
  return [Math.floor(reward.number / 10), reward.number % 10];
}

export function useEntrySlot(callbacks: EntrySlotCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const controllerRef = useRef<EntrySlotInteraction | null>(null);
  const activeRewardRef = useRef<EntryNumberReward | null>(null);
  const [state, setState] = useState<EntrySlotState>({ status: "closed" });
  const createSlotInteractionControllers = useCallback(() => {
    const controller = createEntrySlotInteraction({
      onStateChange: (nextState) => {
        const reward = activeRewardRef.current;
        if (nextState.status === "result" && reward && nextState.result === String(reward.number)) {
          callbacksRef.current.onRewardRevealed(reward.placeId);
        }
        if (nextState.status === "closed") activeRewardRef.current = null;
        setState(nextState);
      },
    });
    controllerRef.current = controller;
    if (activeRewardRef.current) controller.requestReward(getRewardDigits(activeRewardRef.current));

    return [controller];
  }, []);
  const showReward = useCallback((reward: EntryNumberReward) => {
    if (reward.revealed || activeRewardRef.current) return;
    activeRewardRef.current = reward;
    if (controllerRef.current && !controllerRef.current.requestReward(getRewardDigits(reward))) {
      activeRewardRef.current = null;
    }
  }, []);
  const onClose = useCallback(() => {
    controllerRef.current?.deactivate();
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
    showReward,
    onClose,
    onViewportBoundsChange,
  };
}
