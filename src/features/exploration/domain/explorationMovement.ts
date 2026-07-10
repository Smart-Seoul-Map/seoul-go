import { distanceMeters, hasArrived, type Coordinates } from "./explorationGeo";

export type MovementStatus = "idle" | "moving" | "arrived";

export interface CharacterMovement {
  position: Coordinates;
  target: Coordinates;
  arrivalRadiusMeters: number;
  status: MovementStatus;
}

const DEFAULT_ARRIVAL_RADIUS_METERS = 25;

export function createMovement(
  position: Coordinates,
  target: Coordinates,
  arrivalRadiusMeters = DEFAULT_ARRIVAL_RADIUS_METERS
): CharacterMovement {
  return {
    position,
    target,
    arrivalRadiusMeters,
    status: "moving",
  };
}

export function advanceMovement(
  movement: CharacterMovement,
  deltaSeconds: number,
  speedMetersPerSecond: number
): CharacterMovement {
  if (movement.status !== "moving") {
    return movement;
  }

  if (hasArrived(movement.position, movement.target, movement.arrivalRadiusMeters)) {
    return { ...movement, status: "arrived" };
  }

  const totalDistance = distanceMeters(movement.position, movement.target);
  const remainingDistanceToArrivalRadius = Math.max(
    totalDistance - movement.arrivalRadiusMeters,
    0
  );
  const travelDistance = Math.min(
    deltaSeconds * speedMetersPerSecond,
    remainingDistanceToArrivalRadius
  );
  const stepRatio = totalDistance === 0 ? 0 : travelDistance / totalDistance;
  const nextPosition = {
    lng: movement.position.lng + (movement.target.lng - movement.position.lng) * stepRatio,
    lat: movement.position.lat + (movement.target.lat - movement.position.lat) * stepRatio,
  };

  if (travelDistance >= remainingDistanceToArrivalRadius) {
    return { ...movement, position: nextPosition, status: "arrived" };
  }

  return { ...movement, position: nextPosition };
}
