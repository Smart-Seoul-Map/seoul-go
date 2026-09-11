import * as THREE from "three";

import { createAtlasScenery } from "@shared/lib/three/atlasScenery";

import manifest from "../../../assets/entry-exploration/archery-atlas.json";
import atlasUrl from "../../../assets/entry-exploration/archery-atlas.png";
import { ENTRY_EXPLORATION_ARCHERY_RANGE } from "../config/entryExplorationArcheryRange";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { getEntryExplorationFacingQuaternion } from "./entryExplorationThreeScene";

type ArcheryPropModelPlacement = {
  groundSize: number;
  modelUrl: string;
  offset: { x: number; z: number };
  rotation: { x: number; y: number; z: number };
};

const { position, props } = ENTRY_EXPLORATION_ARCHERY_RANGE;

export function createEntryExplorationArcheryRange() {
  const object = new THREE.Group();
  object.name = "entry-archery-range";
  object.position.set(position.x, 0, position.z);
  let disposed = false;

  const { targetBoard } = props;
  const scenery = createAtlasScenery({
    atlasUrl,
    manifest,
    facing: getEntryExplorationFacingQuaternion(),
    name: "entry-archery-scenery",
    placements: [
      {
        key: targetBoard.atlasKey,
        name: `entry-archery-${targetBoard.atlasKey}`,
        width: targetBoard.width,
        position: { x: targetBoard.offset.x, y: targetBoard.yOffset, z: targetBoard.offset.z },
      },
    ],
    onLoadError: () => console.warn("Archery range atlas could not be loaded."),
  });
  object.add(scenery.object);

  [props.bow, props.arrow].forEach((prop) => {
    void loadEntryExplorationGltf(prop.modelUrl)
      .then((gltf) => {
        if (disposed) {
          return;
        }

        object.add(createArcheryPropModel(prop, gltf.scene.clone(true)));
      })
      .catch(() => {
        console.warn(`Archery range prop could not be loaded: ${prop.modelUrl}`);
      });
  });

  return {
    object,
    dispose(): void {
      disposed = true;
      scenery.dispose();
      object.clear();
    },
  };
}

function createArcheryPropModel(
  prop: ArcheryPropModelPlacement,
  model: THREE.Object3D
): THREE.Object3D {
  const placement = new THREE.Group();

  model.rotation.set(prop.rotation.x, prop.rotation.y, prop.rotation.z);
  model.traverse((child) => {
    child.castShadow = true;
  });
  placement.add(model);

  const bounds = new THREE.Box3().setFromObject(placement);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  placement.scale.setScalar(prop.groundSize / Math.max(size.x, size.z, 0.001));
  placement.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(placement);

  placement.position.set(
    prop.offset.x - (scaledBounds.min.x + scaledBounds.max.x) / 2,
    -scaledBounds.min.y,
    prop.offset.z - (scaledBounds.min.z + scaledBounds.max.z) / 2
  );

  return placement;
}
