export const ENTRY_ASSET_PLACE_ARRIVAL_RADIUS = 4;

const ENTRY_ASSET_PLACE_SUBTITLE = "탐방중 이런 정보를 만나요!";

// Keys match the intro atlas frame keys (`entry-scenery-<key>`).
export const ENTRY_ASSET_PLACES = {
  hanok: {
    title: "한옥체험",
    subtitle: ENTRY_ASSET_PLACE_SUBTITLE,
    description:
      "서울의 공공한옥과 한옥체험 정보를 만나보세요. 스마트서울맵에서 공공한옥 위치와 방문 시 유의사항을 확인할 수 있어요.",
    externalLink: {
      label: "한옥체험 지도 보기",
      href: "https://map.seoul.go.kr/smgis2/short/6P5oo",
    },
  },
  waterfront: {
    title: "서울물빛나루",
    subtitle: ENTRY_ASSET_PLACE_SUBTITLE,
    description:
      "물길 곁에서 쉬고 즐길 수 있는 수변활력거점, 서울물빛나루 정보를 만나보세요. 스마트서울맵에서 서울물빛나루 위치를 확인할 수 있어요.",
    externalLink: {
      label: "서울물빛나루 지도 보기",
      href: "https://map.seoul.go.kr/smgis2/short/6PJUP",
    },
  },
  store: {
    title: "서울마음편의점",
    subtitle: ENTRY_ASSET_PLACE_SUBTITLE,
    description:
      "외로울 때 편의점처럼 편하게 들러 마음을 털어놓을 수 있는 서울마음편의점 정보를 만나보세요. 스마트서울맵에서 서울마음편의점 위치를 확인할 수 있어요.",
    externalLink: {
      label: "서울마음편의점 지도 보기",
      href: "https://map.seoul.go.kr/smgis2/short/6PiAJ",
    },
  },
} as const;

export type EntryAssetPlaceId = keyof typeof ENTRY_ASSET_PLACES;
export type EntryAssetPlace = (typeof ENTRY_ASSET_PLACES)[EntryAssetPlaceId];

function isEntryAssetPlaceId(placeId: string): placeId is EntryAssetPlaceId {
  return Object.hasOwn(ENTRY_ASSET_PLACES, placeId);
}

export const ENTRY_ASSET_PLACE_IDS: readonly EntryAssetPlaceId[] =
  Object.keys(ENTRY_ASSET_PLACES).filter(isEntryAssetPlaceId);

export function getEntryAssetPlace(placeId: string): EntryAssetPlace | null {
  return isEntryAssetPlaceId(placeId) ? ENTRY_ASSET_PLACES[placeId] : null;
}

export const ENTRY_HANOK_PLACE_ID = "hanok" satisfies EntryAssetPlaceId;
export const ENTRY_HANOK_PLACE = ENTRY_ASSET_PLACES[ENTRY_HANOK_PLACE_ID];
