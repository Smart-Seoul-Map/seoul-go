import { describe, expect, test } from "vitest";

import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID } from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_STICKER_ASSETS } from "../config/entryExplorationStickers";
import {
  ENTRY_INTRO_LAYOUT_MODEL_IDS,
  ENTRY_INTRO_LAYOUTS,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutViewData,
} from "../config/entryIntroLayout";
import { validateEntryIntroLayoutDocument } from "./entryIntroLayoutValidation";

const STICKERS = ["star.png"];

function withObjects(
  nodes: EntryIntroLayoutDocument["nodes"],
  objects: Record<string, unknown>,
  views: readonly ("pc" | "mobile")[] = ["pc", "mobile"]
): unknown {
  const view = (source: EntryIntroLayoutViewData, isTarget: boolean) => ({
    ...source,
    objects: isTarget ? { ...source.objects, ...objects } : source.objects,
  });

  return {
    nodes,
    guidePlaceId: ENTRY_INTRO_LAYOUTS.guidePlaceId,
    pc: view(ENTRY_INTRO_LAYOUTS.pc, views.includes("pc")),
    mobile: view(ENTRY_INTRO_LAYOUTS.mobile, views.includes("mobile")),
  };
}

describe("validateEntryIntroLayoutDocument", () => {
  test("accepts the stored layout file with the sticker files in the project", () => {
    expect(
      validateEntryIntroLayoutDocument(ENTRY_INTRO_LAYOUTS, ENTRY_EXPLORATION_STICKER_ASSETS)
    ).toEqual([]);
  });

  test("accepts groups, stickers and a fixed object placed inside a group", () => {
    const document = withObjects(
      [
        { id: "zone", kind: "group", name: "아차산 존", parent: ENTRY_INTRO_LAYOUT_MODEL_IDS[4] },
        { id: "star-1", kind: "sticker", asset: "star.png", parent: "zone" },
        { id: "hanok", parent: "zone" },
      ],
      { zone: { x: 1, z: 1, rotation: 20 }, "star-1": { x: 0.5, z: 0, scale: 1.5 } }
    );

    expect(validateEntryIntroLayoutDocument(document, STICKERS)).toEqual([]);
  });

  test.each([
    ["a field other than position, size and angle", { bench: { x: 0, z: 0, color: "#fff" } }],
    ["a zero size", { bench: { x: 0, z: 0, scale: 0 } }],
    [
      "a size on the Seoul tile map",
      { [ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID]: { x: 0, z: 0, scale: 2 } },
    ],
    [
      "an angle on the Seoul tile map",
      { [ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID]: { x: 0, z: 0, rotation: 5 } },
    ],
  ])("rejects %s", (_, objects) => {
    expect(validateEntryIntroLayoutDocument(withObjects([], objects), STICKERS)).not.toEqual([]);
  });

  test("rejects an unknown top-level field", () => {
    const document = { ...ENTRY_INTRO_LAYOUTS, floor: { color: "#fff" } };

    expect(validateEntryIntroLayoutDocument(document, STICKERS)).toContain(
      "배치 파일: 허용되지 않는 칸 floor"
    );
  });

  test.each([
    ["a missing parent", [{ id: "zone", kind: "group", parent: "nowhere" }]],
    [
      "a parent cycle",
      [
        { id: "a", kind: "group", parent: "b" },
        { id: "b", kind: "group", parent: "a" },
      ],
    ],
    [
      "a sticker file that is not in the project",
      [{ id: "s", kind: "sticker", asset: "gone.png" }],
    ],
    ["a node reusing a 3D model id", [{ id: ENTRY_INTRO_LAYOUT_MODEL_IDS[1], kind: "group" }]],
    ["an unknown fixed object", [{ id: "tower" }]],
    [
      "the Seoul tile map inside a group",
      [{ id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID, parent: "hanok" }],
    ],
  ] as const)("rejects %s", (_, nodes) => {
    const ids = nodes.flatMap((node) => ("kind" in node ? [node.id] : []));
    const objects = Object.fromEntries(ids.map((id) => [id, { x: 0, z: 0 }]));

    expect(validateEntryIntroLayoutDocument(withObjects(nodes, objects), STICKERS)).not.toEqual([]);
  });

  test("rejects a guide place that has no 3D model", () => {
    const document = { ...ENTRY_INTRO_LAYOUTS, guidePlaceId: "smart-seoul:0:none" };

    expect(validateEntryIntroLayoutDocument(document, STICKERS)).toContain(
      "화살표 장소 smart-seoul:0:none는 3D 모델이 있는 장소가 아닙니다."
    );
  });

  test("rejects a layout without a position for a 3D model", () => {
    const [missing] = ENTRY_INTRO_LAYOUT_MODEL_IDS;
    const withoutModel = (objects: EntryIntroLayoutViewData["objects"]) =>
      Object.fromEntries(Object.entries(objects).filter(([id]) => id !== missing));
    const document = {
      ...ENTRY_INTRO_LAYOUTS,
      pc: { objects: withoutModel(ENTRY_INTRO_LAYOUTS.pc.objects) },
    };

    expect(validateEntryIntroLayoutDocument(document, STICKERS)).toContain(
      `pc.objects에 ${missing}가 없습니다.`
    );
  });

  test("rejects a group that has a placement in only one view", () => {
    const document = withObjects([{ id: "zone", kind: "group" }], { zone: { x: 0, z: 0 } }, ["pc"]);

    expect(validateEntryIntroLayoutDocument(document, STICKERS)).toContain(
      "mobile.objects에 zone가 없습니다."
    );
  });
});
