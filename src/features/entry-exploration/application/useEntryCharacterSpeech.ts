import { useCallback, useRef, useState } from "react";
import type { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import { createCharacterSpeechAnchor } from "@shared/lib/character/characterSpeechAnchor";

import { ENTRY_GUIDE_MESSAGES } from "../config/entryGuideMessages";

type UseEntryCharacterSpeechOptions = {
  hasStarted: boolean;
  isDartActive: boolean;
};

export type EntryCharacterSpeechLine =
  { key: "intro" } | { key: "firstNumber"; numbers: readonly number[] };

type EntryCharacterSpeech = {
  anchor: CSS2DObject;
  message: string | null;
  handleCharacterMovingChange: (isMoving: boolean) => void;
  say: (line: EntryCharacterSpeechLine) => void;
};

type SpeechStatus = "pending" | "visible" | "ended";

export function useEntryCharacterSpeech({
  hasStarted,
  isDartActive,
}: UseEntryCharacterSpeechOptions): EntryCharacterSpeech {
  const [anchor] = useState(createCharacterSpeechAnchor);
  const [line, setLine] = useState<EntryCharacterSpeechLine>({ key: "intro" });
  const [status, setStatus] = useState<SpeechStatus>("pending");
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;
  const isMovingRef = useRef(false);

  // A line waits while the character walks, shows on the next stop, and ends on the walk after that.
  const handleCharacterMovingChange = useCallback((isMoving: boolean) => {
    isMovingRef.current = isMoving;
    if (!hasStartedRef.current) return;
    setStatus((current) => {
      if (isMoving) return current === "visible" ? "ended" : current;
      return current === "pending" ? "visible" : current;
    });
  }, []);

  const say = useCallback((nextLine: EntryCharacterSpeechLine) => {
    setLine(nextLine);
    setStatus(isMovingRef.current ? "pending" : "visible");
  }, []);

  if (status !== "ended" && hasStarted && isDartActive) {
    setStatus("ended");
  }

  // 인트로 대사 자리는 첫 진입 가이드가 대신하므로 화면에만 숨긴다. 대사 줄·문구·흐름은 그대로 둔다.
  const isHiddenLine = line.key === "intro";
  const message = status === "visible" && !isHiddenLine ? toSpeechMessage(line) : null;

  return { anchor, message, handleCharacterMovingChange, say };
}

function toSpeechMessage(line: EntryCharacterSpeechLine): string {
  return line.key === "intro"
    ? ENTRY_GUIDE_MESSAGES.speech.intro
    : ENTRY_GUIDE_MESSAGES.speech.firstNumber(line.numbers);
}
