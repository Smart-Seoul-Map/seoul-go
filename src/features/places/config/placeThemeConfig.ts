export const SMART_SEOUL_PLACE_THEMES = [
  {
    id: "100032",
    name: "서울 미래유산",
    markerColor: "#e03131",
  },
  {
    id: "1741228380725",
    name: "서울 야경명소",
    markerColor: "#f08c00",
  },
  {
    id: "1777251935025",
    name: "서울물빛나루",
    markerColor: "#f2c94c",
  },
  {
    id: "1725252918740",
    name: "소울스팟",
    markerColor: "#2f9e44",
  },
  {
    id: "100575",
    name: "오래가게",
    markerColor: "#1971c2",
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
