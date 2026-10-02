import { createStore } from "zustand/vanilla";
import {
  loadUnlockedLinkedPlaces,
  saveUnlockedLinkedPlaces,
  type UnlockedLinkedPlaceStorage,
} from "../data/unlockedLinkedPlaceStorage";
import type { UnlockedLinkedPlaceReference } from "../domain/linkedPlaceReference";

export type UnlockedLinkedPlaceStoreState = {
  references: UnlockedLinkedPlaceReference[];
  unlockReferences: (references: readonly UnlockedLinkedPlaceReference[]) => void;
};

export function createUnlockedLinkedPlaceStore({
  storage,
}: { storage?: UnlockedLinkedPlaceStorage | null } = {}) {
  return createStore<UnlockedLinkedPlaceStoreState>()((set, get) => ({
    references: loadUnlockedLinkedPlaces(storage),
    unlockReferences: (incoming) => {
      const previous = get().references;
      const byId = new Map(previous.map((reference) => [reference.id, reference]));
      let changed = false;
      for (const { id, position } of incoming) {
        const existing = byId.get(id);
        if (existing?.position.lat === position.lat && existing.position.lng === position.lng)
          continue;
        byId.set(id, { id, position: { lat: position.lat, lng: position.lng } });
        changed = true;
      }
      if (!changed) return;
      const references = Array.from(byId.values());
      set({ references });
      saveUnlockedLinkedPlaces(references, storage);
    },
  }));
}
