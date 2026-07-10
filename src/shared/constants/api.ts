export const API_BASE_URL = {
  SMART_SEOUL: "https://map.seoul.go.kr/openapi/v5",
} as const;

export const API_PROXY_PATH = {
  SMART_SEOUL_MAP: "/api/smart-seoul-map",
} as const;

export const END_POINTS = {
  smartSeoulThemeContents: (language: string) => `/public/themes/contents/${language}`,
  smartSeoulRasterTile: ({
    mapKind,
    mapId,
    z,
    j,
    k,
    x,
    y,
  }: {
    mapKind: string;
    mapId: string;
    z: number;
    j: number;
    k: number;
    x: number;
    y: number;
  }) => `/public/map/${mapKind}/${mapId}/${z}/${j}/${k}/${x}/${y}/png`,
} as const;

export const HTTP_HEADERS = {
  SMART_SEOUL_RASTER_TILE_ACCEPT:
    "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
} as const;

export const OPEN_STREET_MAP_TILE_URL_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
