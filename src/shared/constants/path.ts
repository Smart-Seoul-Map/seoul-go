export const PATH = {
  DISTRICT_EXPLORATION: "/exploration/districts/:districtId",
  EXPLORATION: "/exploration",
  HOME: "/",
} as const;

export function createDistrictExplorationPath(districtId: number): string {
  return PATH.DISTRICT_EXPLORATION.replace(":districtId", String(districtId));
}
