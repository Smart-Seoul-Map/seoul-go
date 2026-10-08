import { ENTRY_EDITION_PLACE_COUNT } from "../config/entryEditionModels";

import type { EntryEditionPlace } from "./entryEditionPlace";

export function selectEntryEditionPlaces(
  places: readonly EntryEditionPlace[],
  previousIds: readonly string[],
  random: () => number = Math.random
): EntryEditionPlace[] {
  const unique = [...new Map(places.map((place) => [place.id, place])).values()];
  const previous = new Set(previousIds);
  const unseen = shuffle(
    unique.filter((place) => !previous.has(place.id)),
    random
  );
  const repeated = shuffle(
    unique.filter((place) => previous.has(place.id)),
    random
  );

  return [...unseen, ...repeated].slice(0, ENTRY_EDITION_PLACE_COUNT);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [items[index], items[next]] = [items[next], items[index]];
  }

  return items;
}
