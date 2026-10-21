import { ENTRY_EDITION_MODELS, type EntryEditionModel } from "../config/entryEditionModels";

import type { EntryEditionPlace } from "./entryEditionPlace";

export function selectEntryEditionPlaces(
  places: readonly EntryEditionPlace[],
  models: Readonly<Record<string, EntryEditionModel>> = ENTRY_EDITION_MODELS
): EntryEditionPlace[] {
  const unique = new Map(places.map((place) => [place.id, place]));

  return Object.keys(models).flatMap((id) => unique.get(id) ?? []);
}
