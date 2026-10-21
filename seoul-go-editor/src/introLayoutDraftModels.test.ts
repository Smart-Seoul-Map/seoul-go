import { expect, test } from "vitest";

import { ENTRY_INTRO_LAYOUTS } from "../../src/features/entry-exploration/config/entryIntroLayout";
import { getMissingIntroLayoutDraftModelAssets } from "./introLayoutDraftModels";

test("lists each temporary 3D model file a layout needs but the editor has not been given", () => {
  const document = {
    ...ENTRY_INTRO_LAYOUTS,
    nodes: [
      { id: "draft-model-1", kind: "draftModel" as const, asset: "tower.glb" },
      { id: "draft-model-2", kind: "draftModel" as const, asset: "gate.glb" },
      { id: "draft-model-3", kind: "draftModel" as const, asset: "tower.glb" },
      { id: "sticker-1", kind: "sticker" as const, asset: "star.png" },
    ],
  };

  expect(getMissingIntroLayoutDraftModelAssets(document, {})).toEqual(["gate.glb", "tower.glb"]);
  expect(getMissingIntroLayoutDraftModelAssets(document, { "tower.glb": "blob:tower" })).toEqual([
    "gate.glb",
  ]);
  expect(getMissingIntroLayoutDraftModelAssets(ENTRY_INTRO_LAYOUTS, {})).toEqual([]);
});
