import { useCallback, useRef, useState } from "react";
import type { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import { createCharacterSpeechAnchor } from "@shared/lib/character/characterSpeechAnchor";

import type { EntryCharacterSpeechKey } from "../config/entryCharacterSpeechMessages";
import type { EntrySlotState } from "./entrySlotInteraction";

type UseEntryCharacterSpeechOptions = {
  hasStarted: boolean;
  slotStatus: EntrySlotState["status"];
  isDartActive: boolean;
};

type EntryCharacterSpeech = {
  anchor: CSS2DObject;
  speechKey: EntryCharacterSpeechKey | null;
  handleCharacterMovingChange: (isMoving: boolean) => void;
};

type IntroSpeechStatus = "pending" | "visible" | "ended";

export function useEntryCharacterSpeech({
  hasStarted,
  slotStatus,
  isDartActive,
}: UseEntryCharacterSpeechOptions): EntryCharacterSpeech {
  const [anchor] = useState(createCharacterSpeechAnchor);
  const [introStatus, setIntroStatus] = useState<IntroSpeechStatus>("pending");
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;
  const isSlotActive = slotStatus !== "closed";

  // The first stop after the intro starts ends the walk-out; the next walk ends the intro speech.
  const handleCharacterMovingChange = useCallback((isMoving: boolean) => {
    if (!hasStartedRef.current) return;
    setIntroStatus((current) => {
      if (isMoving) return current === "visible" ? "ended" : current;
      return current === "pending" ? "visible" : current;
    });
  }, []);

  if (introStatus === "visible" && (isSlotActive || isDartActive)) {
    setIntroStatus("ended");
  }

  let speechKey: EntryCharacterSpeechKey | null = null;
  if (slotStatus === "lever" || slotStatus === "spinning") speechKey = "slot";
  else if (introStatus === "visible") speechKey = "intro";

  return { anchor, speechKey, handleCharacterMovingChange };
}
