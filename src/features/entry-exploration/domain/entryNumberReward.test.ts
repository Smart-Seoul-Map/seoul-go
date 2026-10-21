import { describe, expect, test } from "vitest";

import {
  createEntryNumberReward,
  getEntryDartNumbers,
  getEntryNumberRewardRows,
  grantEntryNumberReward,
  type EntryNumberReward,
  type EntryNumberRewardPlace,
} from "./entryNumberReward";
import { toSeoulGridCellFromGeoPoint } from "./seoulGridCoordinates";
import { isSeoulGridCellValid } from "./seoulGridNumber";

const NAMSAN: EntryNumberRewardPlace = {
  id: "smart-seoul:1786321258890:25_edition25_24",
  name: "남산공원 백범광장",
  position: { lat: 37.554896208, lng: 126.979811846 },
};
const HONGJECHEON: EntryNumberRewardPlace = {
  id: "smart-seoul:1786321258890:25_edition25_14",
  name: "홍제천 인공폭포",
  position: { lat: 37.581315677, lng: 126.937130858 },
};
const GWANAKSAN: EntryNumberRewardPlace = {
  id: "smart-seoul:1786321258890:26_edition25_5",
  name: "관악산",
  position: { lat: 37.44509452, lng: 126.963660055 },
};
const OFF_BOARD_PLACE: EntryNumberRewardPlace = {
  id: "smart-seoul:1786321258890:25_edition25_99",
  name: "판 밖 장소",
  position: { lat: 35.1796, lng: 129.0756 },
};

const NAMSAN_REWARD: EntryNumberReward = {
  placeId: NAMSAN.id,
  placeName: "남산공원 백범광장",
  east: 54,
  north: 50,
};
const HONGJECHEON_REWARD: EntryNumberReward = {
  placeId: HONGJECHEON.id,
  placeName: "홍제천 인공폭포",
  east: 50,
  north: 53,
};
const SAME_NUMBER_REWARD: EntryNumberReward = {
  placeId: "smart-seoul:1786321258890:26_edition25_99",
  placeName: "같은 번호 장소",
  east: 52,
  north: 52,
};
const HAEBANGCHON_REWARD: EntryNumberReward = {
  placeId: "smart-seoul:1786321258890:25_edition25_21",
  placeName: "해방촌신흥시장",
  east: 54,
  north: 49,
};

describe("entry number rewards", () => {
  test("takes the east and north two digits of the place grid cell", () => {
    expect(createEntryNumberReward(NAMSAN)).toEqual(NAMSAN_REWARD);
    expect(createEntryNumberReward(HONGJECHEON)).toEqual(HONGJECHEON_REWARD);
  });

  test("grants each place once in visit order and returns the same array on a repeat visit", () => {
    const first = grantEntryNumberReward([], NAMSAN);
    const second = grantEntryNumberReward(first, HONGJECHEON);

    expect(first).toEqual([NAMSAN_REWARD]);
    expect(second).toEqual([NAMSAN_REWARD, HONGJECHEON_REWARD]);
    expect(grantEntryNumberReward(second, NAMSAN)).toBe(second);
    expect(grantEntryNumberReward(second, { ...NAMSAN, position: GWANAKSAN.position })).toBe(
      second
    );
  });

  test("grants nothing for a position outside the grid board", () => {
    const rewards = [NAMSAN_REWARD];

    expect(createEntryNumberReward(OFF_BOARD_PLACE)).toBeNull();
    expect(grantEntryNumberReward(rewards, OFF_BOARD_PLACE)).toBe(rewards);
    expect(
      grantEntryNumberReward(rewards, {
        ...OFF_BOARD_PLACE,
        position: { lat: Number.NaN, lng: Number.NaN },
      })
    ).toBe(rewards);
  });

  test("still grants numbers for a boundary cell outside the Seoul cells", () => {
    const cell = toSeoulGridCellFromGeoPoint(GWANAKSAN.position);

    expect(cell).not.toBeNull();
    expect(isSeoulGridCellValid(cell!)).toBe(false);
    expect(grantEntryNumberReward([], GWANAKSAN)).toEqual([
      { placeId: GWANAKSAN.id, placeName: "관악산", east: 52, north: 38 },
    ]);
  });

  test("lists two rows per place in visit order, east before north", () => {
    expect(getEntryNumberRewardRows([NAMSAN_REWARD, HONGJECHEON_REWARD])).toEqual([
      { key: `${NAMSAN.id}:east`, placeName: "남산공원 백범광장", number: 54 },
      { key: `${NAMSAN.id}:north`, placeName: "남산공원 백범광장", number: 50 },
      { key: `${HONGJECHEON.id}:east`, placeName: "홍제천 인공폭포", number: 50 },
      { key: `${HONGJECHEON.id}:north`, placeName: "홍제천 인공폭포", number: 53 },
    ]);
    expect(getEntryNumberRewardRows([])).toEqual([]);
  });

  test("keeps two rows when a place has the same east and north numbers", () => {
    expect(getEntryNumberRewardRows([SAME_NUMBER_REWARD])).toEqual([
      { key: `${SAME_NUMBER_REWARD.placeId}:east`, placeName: "같은 번호 장소", number: 52 },
      { key: `${SAME_NUMBER_REWARD.placeId}:north`, placeName: "같은 번호 장소", number: 52 },
    ]);
  });

  test("passes each number to the dart once in first-seen order", () => {
    expect(
      getEntryDartNumbers([
        NAMSAN_REWARD,
        HONGJECHEON_REWARD,
        SAME_NUMBER_REWARD,
        HAEBANGCHON_REWARD,
      ])
    ).toEqual([54, 50, 53, 52, 49]);
    expect(getEntryDartNumbers([])).toEqual([]);
  });
});
