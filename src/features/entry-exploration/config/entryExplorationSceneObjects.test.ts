import { describe, expect, test } from "vitest";

import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "./entryExplorationAssets";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  type EntryExplorationFloorOverlayObject,
  type EntryExplorationSceneObject,
  type EntryExplorationStandingPropObject,
} from "./entryExplorationSceneObjects";

describe("entry exploration scene objects", () => {
  test("uses unique object ids", () => {
    const objectIds = ENTRY_EXPLORATION_SCENE_OBJECTS.map((object) => object.id);

    expect(new Set(objectIds).size).toBe(objectIds.length);
  });

  test("references configured assets", () => {
    ENTRY_EXPLORATION_SCENE_OBJECTS.forEach((object) => {
      expect(ENTRY_EXPLORATION_TEXTURE_ASSETS[object.assetKey].src).toMatch(
        /\.(png|jpe?g|svg|webp)$/
      );
    });
  });

  test("keeps floor overlay sizes and offsets valid", () => {
    const sceneObjects: readonly EntryExplorationSceneObject[] = ENTRY_EXPLORATION_SCENE_OBJECTS;
    const floorOverlayObjects = sceneObjects.filter(
      (object): object is EntryExplorationFloorOverlayObject => object.type === "floorOverlay"
    );

    floorOverlayObjects.forEach((object) => {
      expect(object.rotationY).toBe(0);
      expect(object.size.width).toBeGreaterThan(0);
      expect(object.size.depth).toBeGreaterThan(0);
      expect(object.yOffset).toBeGreaterThan(0);
    });
  });

  test("keeps standing prop objects explicit", () => {
    const sceneObjects: readonly EntryExplorationSceneObject[] = ENTRY_EXPLORATION_SCENE_OBJECTS;
    const standingPropObjects = sceneObjects.filter(
      (object): object is EntryExplorationStandingPropObject => object.type === "standingProp"
    );

    expect(standingPropObjects).toHaveLength(1);
    standingPropObjects.forEach((object) => {
      expect(object.assetKey).toBeTruthy();
      expect(object.position.x).not.toBe(0);
      expect(object.position.z).not.toBe(0);
      expect(object.shadow.opacity).toBeGreaterThan(0);
      expect(object.shadow.opacity).toBeLessThan(1);
      expect(object.size.height).toBeGreaterThan(0);
    });
  });

  test("keeps interaction trigger radiuses valid", () => {
    const sceneObjects: readonly EntryExplorationSceneObject[] = ENTRY_EXPLORATION_SCENE_OBJECTS;

    sceneObjects.forEach((object) => {
      if (!object.interaction) {
        return;
      }

      expect(object.interaction.triggerRadius).toBeGreaterThan(0);
    });
  });
});
