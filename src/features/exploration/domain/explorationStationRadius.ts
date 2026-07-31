export type StationExplorationRadiusStep = {
  radiusMeters: number;
};

export type GetUnlockedStationExplorationRadiusInput = {
  currentRadiusMeters: number;
  currentRadiusPlaceCount: number;
  visitedPlaceCount: number;
};

export const STATION_EXPLORATION_MAX_REQUIRED_VISIT_COUNT = 3;
const STATION_EXPLORATION_PLACE_COUNT_RATIO = 0.5;

export const STATION_EXPLORATION_RADIUS_STEPS = [
  { radiusMeters: 500 },
  { radiusMeters: 1000 },
  { radiusMeters: 2000 },
] as const satisfies readonly StationExplorationRadiusStep[];

export function getRequiredStationExplorationVisitCount(currentRadiusPlaceCount: number): number {
  if (!Number.isFinite(currentRadiusPlaceCount) || currentRadiusPlaceCount <= 0) {
    return 0;
  }

  return Math.min(
    STATION_EXPLORATION_MAX_REQUIRED_VISIT_COUNT,
    Math.max(1, Math.ceil(currentRadiusPlaceCount * STATION_EXPLORATION_PLACE_COUNT_RATIO))
  );
}

export function getUnlockedStationExplorationRadius({
  currentRadiusMeters,
  currentRadiusPlaceCount,
  visitedPlaceCount,
}: GetUnlockedStationExplorationRadiusInput): number {
  const currentStepIndex = STATION_EXPLORATION_RADIUS_STEPS.findIndex(
    (step) => step.radiusMeters === currentRadiusMeters
  );

  if (
    currentStepIndex < 0 ||
    !Number.isFinite(visitedPlaceCount) ||
    visitedPlaceCount < 0 ||
    !Number.isFinite(currentRadiusPlaceCount) ||
    currentRadiusPlaceCount < 0
  ) {
    return STATION_EXPLORATION_RADIUS_STEPS[0].radiusMeters;
  }

  const requiredVisitCount = getRequiredStationExplorationVisitCount(currentRadiusPlaceCount);

  if (requiredVisitCount === 0 || visitedPlaceCount < requiredVisitCount) {
    return currentRadiusMeters;
  }

  const nextStepIndex = Math.min(currentStepIndex + 1, STATION_EXPLORATION_RADIUS_STEPS.length - 1);

  return STATION_EXPLORATION_RADIUS_STEPS[nextStepIndex].radiusMeters;
}
