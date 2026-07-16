export const API_BASE_URL = {
  SMART_SEOUL: "https://map.seoul.go.kr/openapi/v5",
  SMART_SEOUL_TMS: "https://map.seoul.go.kr/tms",
} as const;

export const API_PROXY_PATH = {
  SMART_SEOUL_MAP: "/api/smart-seoul-map",
} as const;

export const SMART_SEOUL_TMS_MAP_IDS = {
  KOREAN: "dawul_kor_normal_3857_20260223",
} as const;

export const END_POINTS = {
  smartSeoulThemeContents: (language: string) => `/public/themes/contents/${language}`,
  smartSeoulTmsTileTemplate: ({ mapId }: { mapId: string }) => `/tms/${mapId}/{z}/{y}/{x}.png`,
  smartSeoulTmsTile: ({ mapId, z, y, x }: { mapId: string; z: number; y: number; x: number }) =>
    `/tms/${mapId}/${z}/${y}/${x}.png`,
} as const;

export const SMART_SEOUL_TMS_TILE_URL_TEMPLATE = `${API_PROXY_PATH.SMART_SEOUL_MAP}${END_POINTS.smartSeoulTmsTileTemplate({ mapId: SMART_SEOUL_TMS_MAP_IDS.KOREAN })}`;
