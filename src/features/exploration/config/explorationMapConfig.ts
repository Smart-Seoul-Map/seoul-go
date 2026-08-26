import { API_PROXY_PATH, END_POINTS, SMART_SEOUL_TMS_MAP_IDS } from "@shared/constants/api";

type ExplorationMapTileSourceEnvironment = {
  readonly VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH?: string;
};

type ExplorationMapTileSourceConfig = {
  smartSeoulMapTileUrlTemplate: string;
};

export const EXPLORATION_MAP_CENTER: [number, number] = [126.899384, 37.576672];
export const EXPLORATION_MAP_MIN_ZOOM = 15;
export const EXPLORATION_MAP_MAX_ZOOM = 17;
export const EXPLORATION_MAP_PITCH = 40;
export const EXPLORATION_MAP_BEARING = -28;
export const CHARACTER_ARRIVAL_RADIUS_METERS = 25;
export const PLACE_CARD_REVEAL_RADIUS_METERS = 30;
export const CHARACTER_SPEED_METERS_PER_SECOND = 200;

function createSmartSeoulTmsTileUrlTemplate(proxyBasePath: string): string {
  return `${proxyBasePath}${END_POINTS.smartSeoulTmsTileTemplate({
    mapId: SMART_SEOUL_TMS_MAP_IDS.KOREAN,
  })}`;
}

export function resolveExplorationMapTileSourceConfig(
  env: ExplorationMapTileSourceEnvironment
): ExplorationMapTileSourceConfig {
  const smartSeoulMapTileProxyPath =
    env.VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH || API_PROXY_PATH.SMART_SEOUL_MAP;

  return {
    smartSeoulMapTileUrlTemplate: createSmartSeoulTmsTileUrlTemplate(smartSeoulMapTileProxyPath),
  };
}
