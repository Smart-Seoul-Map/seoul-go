import { expect, test } from "vitest";

import { ENTRY_EDITION_MODELS } from "../../src/features/entry-exploration/config/entryEditionModels";
import { INTRO_LAYOUT_MODEL_SLOTS, getIntroLayoutEditionModels } from "./introLayoutModels";

const NAMSAN_PLACE_ID = "smart-seoul:1786321258890:25_edition25_24";

test("lists every registered place model by its file name", () => {
  expect(INTRO_LAYOUT_MODEL_SLOTS).toHaveLength(Object.keys(ENTRY_EDITION_MODELS).length);
  expect(INTRO_LAYOUT_MODEL_SLOTS).toContainEqual({
    placeId: NAMSAN_PLACE_ID,
    fileName: "namsan_baekbeom_square.glb",
  });
});

test("replaces only the URL of chosen models and keeps their app size and rotation", () => {
  const models = getIntroLayoutEditionModels({ [NAMSAN_PLACE_ID]: "blob:designer-model" });

  expect(models[NAMSAN_PLACE_ID]).toEqual({
    ...ENTRY_EDITION_MODELS[NAMSAN_PLACE_ID],
    url: "blob:designer-model",
  });
  Object.entries(ENTRY_EDITION_MODELS)
    .filter(([placeId]) => placeId !== NAMSAN_PLACE_ID)
    .forEach(([placeId, model]) => expect(models[placeId]).toEqual(model));
});

test("keeps the registered models when nothing is chosen", () => {
  expect(getIntroLayoutEditionModels({})).toEqual(ENTRY_EDITION_MODELS);
});
