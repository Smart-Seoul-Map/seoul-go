import { PLACE_THEME_MARKERS } from "@shared/constants/placeThemeMarker";

export const SEOUL_EDITION25_THEME_ID = "1786321258890";
export const PLACE_MARKER_MODEL_BASE_PATH = "/models/markers";

export const SMART_SEOUL_PLACE_THEMES = [
  {
    id: "100032",
    markerModelUrl: `${PLACE_MARKER_MODEL_BASE_PATH}/100032.glb`,
    name: "서울 미래유산",
    ...PLACE_THEME_MARKERS.RED,
  },
  {
    id: "1741228380725",
    markerModelUrl: `${PLACE_MARKER_MODEL_BASE_PATH}/1741228380725.glb`,
    markerModelYawDegrees: -90,
    name: "서울 야경명소",
    ...PLACE_THEME_MARKERS.PURPLE,
  },
  {
    id: "1777251935025",
    markerModelUrl: `${PLACE_MARKER_MODEL_BASE_PATH}/1777251935025.glb`,
    name: "서울물빛나루",
    ...PLACE_THEME_MARKERS.BLUE,
  },
  {
    id: "1725252918740",
    markerModelUrl: `${PLACE_MARKER_MODEL_BASE_PATH}/1725252918740.glb`,
    markerModelYawDegrees: -90,
    name: "소울스팟",
    ...PLACE_THEME_MARKERS.BLACK,
  },
  {
    id: "100575",
    markerModelUrl: `${PLACE_MARKER_MODEL_BASE_PATH}/100575.glb`,
    markerModelYawDegrees: -90,
    name: "오래가게",
    ...PLACE_THEME_MARKERS.YELLOW,
  },
  {
    id: SEOUL_EDITION25_THEME_ID,
    name: "서울에디션25",
    ...PLACE_THEME_MARKERS.BLUE,
  },
] as const;

export type SmartSeoulPlaceTheme = (typeof SMART_SEOUL_PLACE_THEMES)[number];

export const SMART_SEOUL_PLACE_THEME_IDS = SMART_SEOUL_PLACE_THEMES.map((theme) => theme.id);
export const SEOUL_EDITION_THEME_IDS = [SEOUL_EDITION25_THEME_ID] as const;
export const LINKED_PLACE_THEME_IDS = SMART_SEOUL_PLACE_THEME_IDS.filter(
  (id) => id !== SEOUL_EDITION25_THEME_ID
);

const SMART_SEOUL_PLACE_THEME_BY_ID: ReadonlyMap<string, SmartSeoulPlaceTheme> = new Map(
  SMART_SEOUL_PLACE_THEMES.map((theme) => [theme.id, theme])
);

export function getSmartSeoulPlaceTheme(themeId: string): SmartSeoulPlaceTheme | undefined {
  return SMART_SEOUL_PLACE_THEME_BY_ID.get(themeId);
}
