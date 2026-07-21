import { PLACE_THEME_MARKERS } from "@shared/constants/placeThemeMarker";

export const SMART_SEOUL_PLACE_THEMES = [
  {
    id: "100032",
    name: "서울 미래유산",
    ...PLACE_THEME_MARKERS.RED,
  },
  {
    id: "1741228380725",
    name: "서울 야경명소",
    ...PLACE_THEME_MARKERS.PURPLE,
  },
  {
    id: "1777251935025",
    name: "서울물빛나루",
    ...PLACE_THEME_MARKERS.BLUE,
  },
  {
    id: "1725252918740",
    name: "소울스팟",
    ...PLACE_THEME_MARKERS.BLACK,
  },
  {
    id: "100575",
    name: "오래가게",
    ...PLACE_THEME_MARKERS.YELLOW,
  },
] as const;

export type SmartSeoulPlaceTheme = (typeof SMART_SEOUL_PLACE_THEMES)[number];

export const SMART_SEOUL_PLACE_THEME_IDS = SMART_SEOUL_PLACE_THEMES.map((theme) => theme.id);

const SMART_SEOUL_PLACE_THEME_BY_ID: ReadonlyMap<string, SmartSeoulPlaceTheme> = new Map(
  SMART_SEOUL_PLACE_THEMES.map((theme) => [theme.id, theme])
);

export function getSmartSeoulPlaceTheme(themeId: string): SmartSeoulPlaceTheme | undefined {
  return SMART_SEOUL_PLACE_THEME_BY_ID.get(themeId);
}
