export const ENTRY_EXPLORATION_PLACES = {
  tower: {
    title: "N서울타워",
    subtitle: "탐방중 이런 정보를 만나요!",
    description:
      "남산 위에서 서울을 한눈에 내려다볼 수 있는 대표 전망 명소. 낮에는 서울 도심과 산세를, 밤에는 화려한 야경을 즐길 수 있어요.",
    address: "서울 용산구 남산공원길 105",
  },
  hanok: {
    title: "한옥체험",
    subtitle: "탐방중 이런 정보를 만나요!",
    description:
      "서울의 공공한옥과 한옥체험 정보를 만나보세요. 스마트서울맵에서 공공한옥 위치와 방문 시 유의사항을 확인할 수 있어요.",
    externalLink: {
      label: "한옥체험 지도 보기",
      href: "https://map.seoul.go.kr/smgis2/short/6P5oo",
    },
  },
} as const;

export type EntryExplorationPlaceId = keyof typeof ENTRY_EXPLORATION_PLACES;

export const ENTRY_EXPLORATION_PLACE_ARRIVAL_RADIUS_BY_ID = {
  hanok: 4,
  tower: 2.4,
} as const satisfies Record<EntryExplorationPlaceId, number>;
