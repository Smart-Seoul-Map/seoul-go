import type { CharacterModelKey } from "../config/explorationCharacterModels";
import { distanceMeters, type Coordinates } from "../domain/explorationGeo";
import {
  advanceMovement,
  type CharacterMovement,
  type MovementStatus,
} from "../domain/explorationMovement";

export interface TrackedMovementFrame {
  movement: CharacterMovement;
  cameraCenter: Coordinates;
  modelKey: CharacterModelKey;
  characterHeadingRadians: number;
}

export function selectCharacterModelKey(status: MovementStatus): CharacterModelKey {
  return status === "moving" ? "run" : "idlePrimary";
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeRadians(radians: number): number {
  const fullCircleRadians = Math.PI * 2;

  return (
    ((((radians + Math.PI) % fullCircleRadians) + fullCircleRadians) % fullCircleRadians) - Math.PI
  );
}

export function calculateCharacterHeadingRadians(
  from: Coordinates,
  to: Coordinates,
  mapBearingDegrees = 0
): number {
  const averageLatitudeRadians = toRadians((from.lat + to.lat) / 2);
  const eastDelta = (to.lng - from.lng) * Math.cos(averageLatitudeRadians);
  const northDelta = to.lat - from.lat;

  return normalizeRadians(
    Math.atan2(eastDelta, northDelta) - toRadians(mapBearingDegrees) + Math.PI
  );
}

export function calculateLookaheadCoordinates(
  from: Coordinates,
  to: Coordinates,
  maxDistanceMeters: number
): Coordinates {
  const totalDistanceMeters = distanceMeters(from, to);

  if (totalDistanceMeters <= maxDistanceMeters || totalDistanceMeters === 0) {
    return to;
  }

  const ratio = maxDistanceMeters / totalDistanceMeters;

  return {
    lng: from.lng + (to.lng - from.lng) * ratio,
    lat: from.lat + (to.lat - from.lat) * ratio,
  };
}

export function advanceTrackedMovement(
  movement: CharacterMovement,
  deltaSeconds: number,
  speedMetersPerSecond: number,
  mapBearingDegrees = 0
): TrackedMovementFrame {
  const nextMovement = advanceMovement(movement, deltaSeconds, speedMetersPerSecond);

  return {
    movement: nextMovement,
    cameraCenter: nextMovement.position,
    modelKey: selectCharacterModelKey(nextMovement.status),
    characterHeadingRadians: calculateCharacterHeadingRadians(
      movement.position,
      movement.target,
      mapBearingDegrees
    ),
  };
}
