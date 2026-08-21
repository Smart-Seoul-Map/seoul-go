import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactElement } from "react";
import {
  IDLE_CHARACTER_DIRECTION,
  type CharacterDirection,
} from "@shared/lib/character/characterDirection";
import "./AppVirtualJoystick.css";

export type AppVirtualJoystickProps = {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onDirectionChange: (direction: CharacterDirection) => void;
};

type JoystickOffset = {
  x: number;
  y: number;
};

type JoystickStyle = CSSProperties & {
  "--app-virtual-joystick-offset-x": string;
  "--app-virtual-joystick-offset-y": string;
};

const HANDLE_TRAVEL_RATIO = 0.55;
const IDLE_OFFSET: JoystickOffset = { x: 0, y: 0 };

function calculateJoystickMovement(
  element: HTMLElement,
  clientX: number,
  clientY: number
): { direction: CharacterDirection; offset: JoystickOffset } {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = clientX - centerX;
  const deltaY = clientY - centerY;
  const distance = Math.hypot(deltaX, deltaY);
  const radius = Math.max(Math.min(rect.width, rect.height) / 2, 1);
  const strength = Math.min(distance / radius, 1);

  if (distance === 0) {
    return { direction: IDLE_CHARACTER_DIRECTION, offset: IDLE_OFFSET };
  }

  const direction = {
    x: (deltaX / distance) * strength,
    y: (deltaY / distance) * strength,
  };
  const handleTravelRadius = radius * HANDLE_TRAVEL_RATIO;

  return {
    direction,
    offset: {
      x: direction.x * handleTravelRadius,
      y: direction.y * handleTravelRadius,
    },
  };
}

export function AppVirtualJoystick({
  ariaLabel,
  className,
  disabled = false,
  onDirectionChange,
}: AppVirtualJoystickProps): ReactElement {
  const activePointerIdRef = useRef<number | null>(null);
  const onDirectionChangeRef = useRef(onDirectionChange);
  const [offset, setOffset] = useState<JoystickOffset>(IDLE_OFFSET);

  onDirectionChangeRef.current = onDirectionChange;

  const resetJoystick = useCallback(() => {
    activePointerIdRef.current = null;
    setOffset(IDLE_OFFSET);
    onDirectionChangeRef.current(IDLE_CHARACTER_DIRECTION);
  }, []);

  const updateJoystick = (event: PointerEvent<HTMLButtonElement>) => {
    const movement = calculateJoystickMovement(event.currentTarget, event.clientX, event.clientY);

    setOffset(movement.offset);
    onDirectionChangeRef.current(movement.direction);
  };

  useEffect(() => {
    if (disabled && activePointerIdRef.current !== null) {
      resetJoystick();
    }
  }, [disabled, resetJoystick]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateJoystick(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    updateJoystick(event);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    resetJoystick();
  };

  const joystickStyle: JoystickStyle = {
    "--app-virtual-joystick-offset-x": `${offset.x}px`,
    "--app-virtual-joystick-offset-y": `${offset.y}px`,
  };

  return (
    <button
      aria-label={ariaLabel}
      className={["app-virtual-joystick", className].filter(Boolean).join(" ")}
      data-active={activePointerIdRef.current !== null}
      disabled={disabled}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      style={joystickStyle}
      type="button"
    >
      <span aria-hidden="true" className="app-virtual-joystick__handle" />
    </button>
  );
}
