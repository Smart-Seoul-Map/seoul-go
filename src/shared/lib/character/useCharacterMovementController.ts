import { useCallback, useEffect, useRef, useState } from "react";

export type CharacterMovementStatus = "moving" | "arrived";
export type CharacterMovementModelKey = "idlePrimary" | "run";

export type CharacterMovementFrame<TPosition> = {
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
  moveTo: (target: TPosition) => void;
  stop: () => void;
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
    targetRef.current = null;
    setModelKey("idlePrimary");
  }, [cancelScheduledFrame]);

  const completeMovement = useCallback(
    (position: TPosition, target: TPosition) => {
      cancelScheduledFrame();
      isMovingRef.current = false;
      targetRef.current = null;
      setModelKey("idlePrimary");
      optionsRef.current.onArrive?.({ position, target });
    },
    [cancelScheduledFrame]
  );

  tickRef.current = (time: number) => {
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
      options.onFrame?.({ position: currentPosition, status: "arrived", target });
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
      targetRef.current = target;
      isMovingRef.current = true;
      lastFrameTimeRef.current = null;
      setHeadingRadians(optionsRef.current.getHeadingRadians(currentPosition, target));
      setModelKey("run");
      scheduleNextFrame();
    },
    [cancelScheduledFrame, scheduleNextFrame]
  );

  const getCurrentPosition = useCallback(() => positionRef.current, []);
  const getIsMoving = useCallback(() => isMovingRef.current, []);

  useEffect(() => stop, [stop]);

  return {
    getCurrentPosition,
    getIsMoving,
    headingRadians,
    modelKey,
    moveTo,
    stop,
  };
}
