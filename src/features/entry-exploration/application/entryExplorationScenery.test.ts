import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import { createEntryExplorationScenery } from "./entryExplorationScenery";
import { ENTRY_EXPLORATION_SCENERY_OBJECTS } from "../config/entryExplorationSceneryObjects";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";

afterEach(() => vi.restoreAllMocks());

test("places every atlas sprite at its layout point and follows a moved hanok while leaving unused frames out", () => {
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockReturnValue(new THREE.Texture());
  const scenery = createEntryExplorationScenery();
  const layout = ENTRY_INTRO_LAYOUTS.pc;
  scenery.applyLayout(layout);
  expect(scenery.object.getObjectByName("entry-scenery-bench")).toBeTruthy();
  for (const { key } of ENTRY_EXPLORATION_SCENERY_OBJECTS) {
    const sprite = scenery.object.getObjectByName(`entry-scenery-${key}`);
    expect(sprite?.position.x).toBe(layout.objects[key].x);
    expect(sprite?.position.z).toBe(layout.objects[key].z);
  }
  const hanok = scenery.object.getObjectByName("entry-scenery-hanok");
  const height = hanok?.position.y;
  const movedHanok = { x: layout.objects.hanok.x + 3, z: layout.objects.hanok.z - 2 };
  scenery.applyLayout({ ...layout, objects: { ...layout.objects, hanok: movedHanok } });
  expect(hanok?.position.x).toBe(movedHanok.x);
  expect(hanok?.position.z).toBe(movedHanok.z);
  expect(hanok?.position.y).toBe(height);
  for (const key of ["tower", "pin", "emphasis", "bicycle"]) {
    expect(scenery.object.getObjectByName(`entry-scenery-${key}`)).toBeUndefined();
  }
  scenery.dispose();
});
