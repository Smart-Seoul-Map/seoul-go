export const PATH = {
  DISTRICT_EXPLORATION: "/exploration/districts/:districtId",
  EXPLORATION: "/exploration",
  HOME: "/",
  SUBWAY_STATION_EXPLORATION: "/exploration/stations/:stationId",
} as const;

export function createDistrictExplorationPath(districtId: number): string {
  return PATH.DISTRICT_EXPLORATION.replace(":districtId", String(districtId));
}

export function createSubwayStationExplorationPath(stationId: string): string {
  return PATH.SUBWAY_STATION_EXPLORATION.replace(":stationId", encodeURIComponent(stationId));
}
