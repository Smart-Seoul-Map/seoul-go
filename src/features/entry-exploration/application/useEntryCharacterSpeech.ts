import { useCallback, useRef, useState } from "react";
import type { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import { createCharacterSpeechAnchor } from "@shared/lib/character/characterSpeechAnchor";

import type { ENTRY_GUIDE_MESSAGES } from "../config/entryGuideMessages";

type EntryCharacterSpeechKey = keyof typeof ENTRY_GUIDE_MESSAGES.speech;

type UseEntryCharacterSpeechOptions = {
  hasStarted: boolean;
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
  isDartActive,
}: UseEntryCharacterSpeechOptions): EntryCharacterSpeech {
  const [anchor] = useState(createCharacterSpeechAnchor);
  const [introStatus, setIntroStatus] = useState<IntroSpeechStatus>("pending");
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;

  // The first stop after the intro starts ends the walk-out; the next walk ends the intro speech.
  const handleCharacterMovingChange = useCallback((isMoving: boolean) => {
    if (!hasStartedRef.current) return;
    setIntroStatus((current) => {
      if (isMoving) return current === "visible" ? "ended" : current;
      return current === "pending" ? "visible" : current;
    });
  }, []);

  if (introStatus === "visible" && isDartActive) {
    setIntroStatus("ended");
  }

  const speechKey: EntryCharacterSpeechKey | null = introStatus === "visible" ? "intro" : null;

  return { anchor, speechKey, handleCharacterMovingChange };
}
