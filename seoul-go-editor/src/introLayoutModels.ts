import {
  ENTRY_EDITION_MODELS,
  type EntryEditionModel,
} from "../../src/features/entry-exploration/config/entryEditionModels";

export type IntroLayoutModelUrls = Readonly<Record<string, string>>;

export type IntroLayoutModelSlot = {
  placeId: string;
  fileName: string;
};

export const INTRO_LAYOUT_MODEL_SLOTS: readonly IntroLayoutModelSlot[] = Object.entries(
  ENTRY_EDITION_MODELS
).map(([placeId, { url }]) => ({ placeId, fileName: url.slice(url.lastIndexOf("/") + 1) }));

export function getIntroLayoutEditionModels(
  urls: IntroLayoutModelUrls
): Readonly<Record<string, EntryEditionModel>> {
  return Object.fromEntries(
    Object.entries(ENTRY_EDITION_MODELS).map(([placeId, model]) => [
      placeId,
      { ...model, url: urls[placeId] ?? model.url },
    ])
  );
}
