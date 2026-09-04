export const PATH = {
  DISTRICT_EXPLORATION: "/exploration/districts/:districtId",
  EXPLORATION: "/exploration",
  HOME: "/",
  SUBWAY_STATION_EXPLORATION: "/exploration/stations/:stationId",
} as const;

export type ExplorationSpawnCenter = {
  lat: number;
  lng: number;
};

export function createDistrictExplorationPath(
  districtId: number,
  spawnCenter?: ExplorationSpawnCenter
): string {
  const path = PATH.DISTRICT_EXPLORATION.replace(":districtId", String(districtId));

  if (!spawnCenter) {
    return path;
  }

  const query = new URLSearchParams({
    lat: String(spawnCenter.lat),
    lng: String(spawnCenter.lng),
  });

  return `${path}?${query.toString()}`;
}

export function parseExplorationSpawnCenter(
  params: URLSearchParams
): ExplorationSpawnCenter | null {
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function createSubwayStationExplorationPath(stationId: string): string {
  return PATH.SUBWAY_STATION_EXPLORATION.replace(":stationId", encodeURIComponent(stationId));
}
