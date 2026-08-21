import { useEffect, useRef } from "react";

import {
  IDLE_CHARACTER_DIRECTION,
  normalizeCharacterDirection,
  type CharacterDirection,
} from "./characterDirection";

type UseKeyboardCharacterDirectionOptions = {
  disabled?: boolean;
  onDirectionChange: (direction: CharacterDirection) => void;
};

const KEY_DIRECTIONS: Readonly<Record<string, CharacterDirection>> = {
  arrowdown: { x: 0, y: 1 },
  arrowleft: { x: -1, y: 0 },
  arrowright: { x: 1, y: 0 },
  arrowup: { x: 0, y: -1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: 0, y: -1 },
};

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

function getPressedKeysDirection(pressedKeys: ReadonlySet<string>): CharacterDirection {
  const direction = [...pressedKeys].reduce<CharacterDirection>(
    (result, key) => ({
      x: result.x + KEY_DIRECTIONS[key].x,
      y: result.y + KEY_DIRECTIONS[key].y,
    }),
    { x: 0, y: 0 }
  );

  return normalizeCharacterDirection(direction);
}

export function useKeyboardCharacterDirection({
  disabled = false,
  onDirectionChange,
}: UseKeyboardCharacterDirectionOptions): void {
  const onDirectionChangeRef = useRef(onDirectionChange);
  const pressedKeysRef = useRef(new Set<string>());
  const animFrameIdRef = useRef<number | null>(null);

  onDirectionChangeRef.current = onDirectionChange;

  useEffect(() => {
    const cancelLoop = () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };

    const updateDirectionLoop = () => {
      if (pressedKeysRef.current.size === 0) {
        animFrameIdRef.current = null;
        return;
      }

      onDirectionChangeRef.current(getPressedKeysDirection(pressedKeysRef.current));
      animFrameIdRef.current = requestAnimationFrame(updateDirectionLoop);
    };

    const startLoopIfNeeded = () => {
      if (animFrameIdRef.current === null && pressedKeysRef.current.size > 0) {
        animFrameIdRef.current = requestAnimationFrame(updateDirectionLoop);
      }
    };

    const clearPressedKeys = () => {
      cancelLoop();

      if (pressedKeysRef.current.size === 0) {
        return;
      }

      pressedKeysRef.current.clear();
      onDirectionChangeRef.current(IDLE_CHARACTER_DIRECTION);
    };

    if (disabled) {
      clearPressedKeys();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (!KEY_DIRECTIONS[key] || isTextInputTarget(event.target)) {
        return;
      }

      event.preventDefault();

      if (pressedKeysRef.current.has(key)) {
        return;
      }

      pressedKeysRef.current.add(key);
      startLoopIfNeeded();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (!KEY_DIRECTIONS[key] || !pressedKeysRef.current.delete(key)) {
        return;
      }

      event.preventDefault();

      if (pressedKeysRef.current.size === 0) {
        cancelLoop();
        onDirectionChangeRef.current(IDLE_CHARACTER_DIRECTION);
      }
    };

    window.addEventListener("blur", clearPressedKeys);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      cancelLoop();
      window.removeEventListener("blur", clearPressedKeys);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [disabled]);
}
