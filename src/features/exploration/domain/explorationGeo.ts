export interface Coordinates {
  lng: number;
  lat: number;
}

export const RADIUS_STEPS_METERS = [500, 1000, 1500, 2000] as const;

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function distanceMeters(from: Coordinates, to: Coordinates): number {
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function canMoveWithinRadius(
  origin: Coordinates,
  target: Coordinates,
  radiusMeters: number
): boolean {
  return distanceMeters(origin, target) <= radiusMeters;
}

export function hasArrived(
  current: Coordinates,
  target: Coordinates,
  arrivalRadiusMeters: number
): boolean {
  return distanceMeters(current, target) <= arrivalRadiusMeters;
}

export function nextRadius(currentRadiusMeters: number): number {
  const currentIndex = RADIUS_STEPS_METERS.findIndex((radius) => radius === currentRadiusMeters);
  const nextIndex =
    currentIndex < 0 ? 0 : Math.min(currentIndex + 1, RADIUS_STEPS_METERS.length - 1);

  return RADIUS_STEPS_METERS[nextIndex];
}
