import type { CharacterDirection } from "@shared/lib/character/characterDirection";

import type { Coordinates } from "./explorationGeo";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function advanceCoordinatesByScreenDirection(
  position: Coordinates,
  direction: CharacterDirection,
  distanceMeters: number,
  mapBearingDegrees: number
): Coordinates {
  const bearingRadians = toRadians(mapBearingDegrees);
  const eastDistanceMeters =
    (direction.x * Math.cos(bearingRadians) - direction.y * Math.sin(bearingRadians)) *
    distanceMeters;
  const northDistanceMeters =
    (-direction.x * Math.sin(bearingRadians) - direction.y * Math.cos(bearingRadians)) *
    distanceMeters;
  const latitudeRadians = toRadians(position.lat);

  return {
    lat: position.lat + toDegrees(northDistanceMeters / EARTH_RADIUS_METERS),
    lng:
      position.lng +
      toDegrees(eastDistanceMeters / (EARTH_RADIUS_METERS * Math.cos(latitudeRadians))),
  };
}
