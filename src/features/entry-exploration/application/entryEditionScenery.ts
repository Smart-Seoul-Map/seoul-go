import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import { ENTRY_EDITION_MODELS } from "../config/entryEditionModels";
import type { EntryEditionPlace } from "../domain/entryEditionPlace";
import { getEntryEditionPosition } from "../domain/entryEditionLayout";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import { createEntryEditionModel } from "./entryEditionModel";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";

export function createEntryEditionScenery(
  places: readonly EntryEditionPlace[],
  onApproach: (destination: EntryExplorationScenePoint) => void
) {
  const object = new THREE.Group();
  object.name = "entry-edition-places";
  const landmarks = new Map<string, THREE.Group>();
  const disposers: (() => void)[] = [];
  let disposed = false;

  for (const place of places) {
    const landmark = new THREE.Group();
    landmark.name = `entry-place-${place.id}`;
    landmark.userData.placeId = place.id;
    object.add(landmark);
    landmarks.set(place.id, landmark);
    const showImage = () => {
      if (disposed) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "EntryEditionLandmark";
      button.dataset.placeId = place.id;
      button.setAttribute("aria-label", `${place.name} 방문`);
      button.onclick = () => onApproach(landmark.position);
      const image = document.createElement("img");
      image.className = "EntryEditionLandmark-image";
      image.alt = "";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.src = place.imageUrl || "/images/seoul-characters/hachi.png";
      image.onerror = () => {
        image.onerror = null;
        image.src = "/images/seoul-characters/hachi.png";
      };
      button.append(image);
      const label = new CSS2DObject(button);
      label.center.set(0.5, 1);
      label.position.y = 0.1;
      landmark.add(label);
      disposers.push(() => {
        image.onerror = null;
        button.onclick = null;
        button.remove();
      });
    };
    const asset = ENTRY_EDITION_MODELS[place.id];
    if (!asset) {
      showImage();
      continue;
    }
    void loadEntryExplorationGltf(asset.url)
      .then((gltf) => {
        if (disposed) return;
        const model = createEntryEditionModel(gltf.scene, asset);
        landmark.add(model.object);
        disposers.push(model.dispose);
      })
      .catch(showImage);
  }

  return {
    object,
    landmarks,
    positionAtEntry(aspect: number): EntryExplorationScenePoint | null {
      places.forEach((place, index) => {
        const point = getEntryEditionPosition(index, aspect);
        landmarks.get(place.id)?.position.set(point.x, 0.06, point.z);
      });
      return places.length ? getEntryEditionPosition(0, aspect) : null;
    },
    getPointerDestination(raycaster: THREE.Raycaster): EntryExplorationScenePoint | null {
      const hit = raycaster.intersectObject(object, true)[0];
      let target: THREE.Object3D | null = hit?.object ?? null;
      while (target && target.parent !== object) target = target.parent;
      return target ? { x: target.position.x, z: target.position.z } : null;
    },
    dispose(): void {
      disposed = true;
      disposers.forEach((dispose) => dispose());
      landmarks.clear();
      object.removeFromParent();
      object.clear();
    },
  };
}
