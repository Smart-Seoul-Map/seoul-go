import { useCallback, useEffect, useRef, useState } from "react";

import { clampCharacterDirection, type CharacterDirection } from "./characterDirection";

export type CharacterMovementStatus = "moving" | "arrived";
export type CharacterMovementModelKey = "idlePrimary" | "walk";

export type CharacterMovementFrame<TPosition> =
  | {
      movementType: "direction";
      position: TPosition;
      status: "moving";
    }
  | {
      movementType: "target";
      position: TPosition;
      status: CharacterMovementStatus;
      target: TPosition;
    };

export type CharacterMovementArrival<TPosition> = {
  position: TPosition;
  target: TPosition;
};

type CharacterMovementControllerOptions<TPosition> = {
  arrivalRadius: number;
  getDistance: (from: TPosition, to: TPosition) => number;
  getHeadingRadians: (from: TPosition, to: TPosition) => number;
  initialPosition: TPosition;
  interpolate: (from: TPosition, to: TPosition, ratio: number) => TPosition;
  maxFrameDeltaSeconds?: number;
  onArrive?: (arrival: CharacterMovementArrival<TPosition>) => void;
  onFrame?: (frame: CharacterMovementFrame<TPosition>) => void;
  speedPerSecond: number;
};

type CharacterMovementController<TPosition> = {
  getCurrentPosition: () => TPosition;
  getIsMoving: () => boolean;
  headingRadians: number;
  modelKey: CharacterMovementModelKey;
  moveInDirection: (movement: CharacterDirectionalMovement<TPosition>) => void;
  moveTo: (target: TPosition) => void;
  stop: () => void;
};

export type CharacterDirectionalMovement<TPosition> = {
  advancePosition: (
    position: TPosition,
    direction: CharacterDirection,
    distance: number
  ) => TPosition;
  direction: CharacterDirection;
};

export function useCharacterMovementController<TPosition>({
  arrivalRadius,
  getDistance,
  getHeadingRadians,
  initialPosition,
  interpolate,
  maxFrameDeltaSeconds = 0.05,
  onArrive,
  onFrame,
  speedPerSecond,
}: CharacterMovementControllerOptions<TPosition>): CharacterMovementController<TPosition> {
  const optionsRef = useRef({
    arrivalRadius,
    getDistance,
    getHeadingRadians,
    interpolate,
    maxFrameDeltaSeconds,
    onArrive,
    onFrame,
    speedPerSecond,
  });
  const frameRef = useRef<number | null>(null);
  const directionalMovementRef = useRef<CharacterDirectionalMovement<TPosition> | null>(null);
  const isMovingRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);
  const positionRef = useRef(initialPosition);
  const targetRef = useRef<TPosition | null>(null);
  const tickRef = useRef<(time: number) => void>(() => {});
  const [headingRadians, setHeadingRadians] = useState(0);
  const [modelKey, setModelKey] = useState<CharacterMovementModelKey>("idlePrimary");

  optionsRef.current = {
    arrivalRadius,
    getDistance,
    getHeadingRadians,
    interpolate,
    maxFrameDeltaSeconds,
    onArrive,
    onFrame,
    speedPerSecond,
  };

  const cancelScheduledFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = null;
    lastFrameTimeRef.current = null;
  }, []);

  const scheduleNextFrame = useCallback(() => {
    frameRef.current = requestAnimationFrame((time) => {
      tickRef.current(time);
    });
  }, []);

  const stop = useCallback(() => {
    cancelScheduledFrame();
    isMovingRef.current = false;
    directionalMovementRef.current = null;
    targetRef.current = null;
    setModelKey("idlePrimary");
  }, [cancelScheduledFrame]);

  const completeMovement = useCallback(
    (position: TPosition, target: TPosition) => {
      cancelScheduledFrame();
      isMovingRef.current = false;
      directionalMovementRef.current = null;
      targetRef.current = null;
      setModelKey("idlePrimary");
      optionsRef.current.onArrive?.({ position, target });
    },
    [cancelScheduledFrame]
  );

  tickRef.current = (time: number) => {
    const directionalMovement = directionalMovementRef.current;

    if (directionalMovement) {
      const options = optionsRef.current;
      const lastFrameTime = lastFrameTimeRef.current ?? time;
      lastFrameTimeRef.current = time;

      const deltaSeconds = Math.min((time - lastFrameTime) / 1000, options.maxFrameDeltaSeconds);
      const currentPosition = positionRef.current;
      const travelDistance = deltaSeconds * options.speedPerSecond;
      const nextPosition = directionalMovement.advancePosition(
        currentPosition,
        directionalMovement.direction,
        travelDistance
      );

      positionRef.current = nextPosition;
      options.onFrame?.({
        movementType: "direction",
        position: nextPosition,
        status: "moving",
      });
      scheduleNextFrame();
      return;
    }

    const target = targetRef.current;

    if (!target) {
      stop();
      return;
    }

    const options = optionsRef.current;
    const lastFrameTime = lastFrameTimeRef.current ?? time;
    lastFrameTimeRef.current = time;

    const deltaSeconds = Math.min((time - lastFrameTime) / 1000, options.maxFrameDeltaSeconds);
    const currentPosition = positionRef.current;
    const distanceToTarget = options.getDistance(currentPosition, target);

    if (distanceToTarget <= options.arrivalRadius) {
      options.onFrame?.({
        movementType: "target",
        position: currentPosition,
        status: "arrived",
        target,
      });
      completeMovement(currentPosition, target);
      return;
    }

    const remainingDistanceToArrivalRadius = Math.max(distanceToTarget - options.arrivalRadius, 0);
    const travelDistance = Math.min(
      deltaSeconds * options.speedPerSecond,
      remainingDistanceToArrivalRadius
    );
    const ratio = distanceToTarget === 0 ? 0 : travelDistance / distanceToTarget;
    const nextPosition = options.interpolate(currentPosition, target, ratio);
    const hasArrived = travelDistance >= remainingDistanceToArrivalRadius;

    positionRef.current = nextPosition;
    options.onFrame?.({
      movementType: "target",
      position: nextPosition,
      status: hasArrived ? "arrived" : "moving",
      target,
    });

    if (hasArrived) {
      completeMovement(nextPosition, target);
      return;
    }

    scheduleNextFrame();
  };

  const moveTo = useCallback(
    (target: TPosition) => {
      const currentPosition = positionRef.current;

      cancelScheduledFrame();
      directionalMovementRef.current = null;
      targetRef.current = target;
      isMovingRef.current = true;
      lastFrameTimeRef.current = null;
      setHeadingRadians(optionsRef.current.getHeadingRadians(currentPosition, target));
      setModelKey("walk");
      scheduleNextFrame();
    },
    [cancelScheduledFrame, scheduleNextFrame]
  );

  const moveInDirection = useCallback(
    (movement: CharacterDirectionalMovement<TPosition>) => {
      const direction = clampCharacterDirection(movement.direction);

      if (direction.x === 0 && direction.y === 0) {
        stop();
        return;
      }

      const nextMovement = { ...movement, direction };
      const currentPosition = positionRef.current;
      const headingTarget = movement.advancePosition(currentPosition, direction, 1);

      setHeadingRadians(optionsRef.current.getHeadingRadians(currentPosition, headingTarget));
      setModelKey("walk");

      if (directionalMovementRef.current) {
        directionalMovementRef.current = nextMovement;
        return;
      }

      cancelScheduledFrame();
      directionalMovementRef.current = nextMovement;
      targetRef.current = null;
      isMovingRef.current = true;
      lastFrameTimeRef.current = null;
      scheduleNextFrame();
    },
    [cancelScheduledFrame, scheduleNextFrame, stop]
  );

  const getCurrentPosition = useCallback(() => positionRef.current, []);
  const getIsMoving = useCallback(() => isMovingRef.current, []);

  useEffect(() => stop, [stop]);

  return {
    getCurrentPosition,
    getIsMoving,
    headingRadians,
    modelKey,
    moveInDirection,
    moveTo,
    stop,
  };
}
