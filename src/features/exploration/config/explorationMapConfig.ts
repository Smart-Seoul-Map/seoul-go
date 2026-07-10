import { API_PROXY_PATH } from "@shared/constants/api";

type ExplorationMapTileSourceEnvironment = {
  readonly VITE_SMART_SEOUL_MAP_KEY?: string;
  readonly VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH?: string;
};

type ExplorationMapTileSourceConfig = {
  isSmartSeoulMapTileEnabled: boolean;
  smartSeoulMapTileProxyPath: string;
};

export const EXPLORATION_MAP_CENTER: [number, number] = [126.899384, 37.576672];
export const EXPLORATION_MAP_LOCKED_ZOOM = 18;
export const EXPLORATION_MAP_PITCH = 40;
export const EXPLORATION_MAP_BEARING = -28;
export const CHARACTER_ARRIVAL_RADIUS_METERS = 25;
export const CHARACTER_SPEED_METERS_PER_SECOND = 100;

export function resolveExplorationMapTileSourceConfig(
  env: ExplorationMapTileSourceEnvironment
): ExplorationMapTileSourceConfig {
  const smartSeoulMapTileProxyPath =
    env.VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH || API_PROXY_PATH.SMART_SEOUL_MAP;
  const isSmartSeoulMapTileEnabled = Boolean(
    env.VITE_SMART_SEOUL_MAP_KEY || env.VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH
  );

  return {
    isSmartSeoulMapTileEnabled,
    smartSeoulMapTileProxyPath,
  };
}
