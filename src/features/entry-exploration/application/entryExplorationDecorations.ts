import * as THREE from "three";

import {
  ENTRY_EXPLORATION_DECORATION_MODEL,
  ENTRY_EXPLORATION_DECORATIONS,
} from "../config/entryExplorationDecorations";
import type { EntryIntroLayout } from "../config/entryIntroLayout";
import { createEntryEditionModel } from "./entryEditionModel";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";

export function createEntryExplorationDecorations() {
  const object = new THREE.Group();
  object.name = "entry-decorations";
  const disposers: (() => void)[] = [];
  let disposed = false;

  const holders = ENTRY_EXPLORATION_DECORATIONS.map(({ key, url }) => {
    const holder = new THREE.Group();
    holder.name = `entry-${key}`;
    object.add(holder);
    void loadEntryExplorationGltf(url)
      .then((gltf) => {
        if (disposed) return;
        const model = createEntryEditionModel(gltf.scene, ENTRY_EXPLORATION_DECORATION_MODEL);
        holder.add(model.object);
        disposers.push(model.dispose);
      })
      .catch(() => {
        console.warn(`Entry decoration could not be loaded: ${url}`);
      });

    return { key, holder };
  });

  return {
    object,
    applyLayout(layout: EntryIntroLayout): void {
      holders.forEach(({ key, holder }) => {
        const point = layout.objects[key];

        holder.position.set(point.x, 0.06, point.z);
      });
    },
    dispose(): void {
      disposed = true;
      disposers.forEach((dispose) => dispose());
      object.removeFromParent();
      object.clear();
    },
  };
}
