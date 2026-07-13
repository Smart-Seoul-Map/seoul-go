export const PATH = {
  HOME: "/",
  EXPLORATION: "/exploration",
  EXPLORATION_DISTRICTS: "/exploration/districts",
  ROULETTE: "/roulette",
  ROULETTE_MAP: "/roulette/map",
  ROULETTE_WHEEL: "/roulette/wheel",
} as const;

const DISTRICT_EXPLORATION_PATH_PATTERN = /^\/exploration\/districts\/(\d+)$/;

export function createDistrictExplorationPath(districtId: number): string {
  return `${PATH.EXPLORATION_DISTRICTS}/${districtId}`;
}

export function matchDistrictExplorationPath(pathname: string): number | null {
  const match = DISTRICT_EXPLORATION_PATH_PATTERN.exec(pathname);
  const districtId = Number(match?.[1]);

  if (!Number.isSafeInteger(districtId)) {
    return null;
  }

  return districtId;
}
