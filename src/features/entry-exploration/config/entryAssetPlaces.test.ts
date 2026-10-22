import { expect, test } from "vitest";

import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import {
  ENTRY_ASSET_PLACE_ARRIVAL_RADIUS,
  ENTRY_ASSET_PLACE_IDS,
  ENTRY_HANOK_PLACE,
  getEntryAssetPlace,
} from "./entryAssetPlaces";
import { ENTRY_EXPLORATION_SCENERY_OBJECTS } from "./entryExplorationSceneryObjects";
import { isEntryNumberRewardPlaceId } from "./entryNumberRewardConfig";

test("keeps the hanok panel unchanged and gives waterfront and store their own map links", () => {
  expect(ENTRY_ASSET_PLACE_IDS).toEqual(["hanok", "waterfront", "store"]);
  expect(ENTRY_ASSET_PLACE_ARRIVAL_RADIUS).toBe(4);
  expect(getEntryAssetPlace("hanok")).toBe(ENTRY_HANOK_PLACE);
  expect(ENTRY_HANOK_PLACE).toEqual({
    title: "한옥체험",
    subtitle: "탐방중 이런 정보를 만나요!",
    description:
      "서울의 공공한옥과 한옥체험 정보를 만나보세요. 스마트서울맵에서 공공한옥 위치와 방문 시 유의사항을 확인할 수 있어요.",
    externalLink: {
      label: "한옥체험 지도 보기",
      href: "https://map.seoul.go.kr/smgis2/short/6P5oo",
    },
  });
  expect(getEntryAssetPlace("waterfront")).toMatchObject({
    title: "물빛나루",
    subtitle: "탐방중 이런 정보를 만나요!",
    externalLink: {
      label: "물빛나루 지도 보기",
      href: "https://map.seoul.go.kr/smgis2/seoulMap",
    },
  });
  expect(getEntryAssetPlace("store")).toMatchObject({
    title: "마음편의점",
    subtitle: "탐방중 이런 정보를 만나요!",
    externalLink: {
      label: "마음편의점 지도 보기",
      href: "https://map.seoul.go.kr/smgis2",
    },
  });
  for (const placeId of ENTRY_ASSET_PLACE_IDS) {
    // Like hanok, the panels show the image placeholder and no address.
    expect(getEntryAssetPlace(placeId)).not.toHaveProperty("image");
    expect(getEntryAssetPlace(placeId)).not.toHaveProperty("address");
  }
});

test("matches every asset to an intro scenery sprite without touching edition places or rewards", () => {
  const sceneryKeys: readonly string[] = ENTRY_EXPLORATION_SCENERY_OBJECTS.map(({ key }) => key);
  for (const placeId of ENTRY_ASSET_PLACE_IDS) {
    expect(sceneryKeys).toContain(placeId);
    expect(isEntryNumberRewardPlaceId(placeId)).toBe(false);
  }
  expect(getEntryAssetPlace(ENTRY_TEST_PLACES[0].id)).toBeNull();
});
