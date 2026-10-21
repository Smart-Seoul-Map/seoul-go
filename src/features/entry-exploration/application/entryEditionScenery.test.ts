import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import { ENTRY_EDITION_MODELS } from "../config/entryEditionModels";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import { resolveEntryIntroLayout } from "../domain/entryIntroLayout";
import { ENTRY_MODELED_TEST_PLACES, ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { createEntryEditionScenery } from "./entryEditionScenery";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";

vi.mock("./entryExplorationGltfLoader", () => ({ loadEntryExplorationGltf: vi.fn() }));
afterEach(() => vi.resetAllMocks());

test("shows API images without captions and connects image buttons to scene destinations", () => {
  const approach = vi.fn();
  const scenery = createEntryEditionScenery(ENTRY_TEST_PLACES, approach);
  const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 390 / 844);
  const destination = scenery.applyLayout(layout);
  const first = scenery.landmarks.get(ENTRY_TEST_PLACES[0].id)!;
  const second = scenery.landmarks.get(ENTRY_TEST_PLACES[1].id)!;
  expect(layout.edition[0]).toMatchObject({ x: first.position.x, z: first.position.z });
  expect(layout.edition[1]).toMatchObject({ x: second.position.x, z: second.position.z });
  const element = first.children[0] as THREE.Object3D & { element: HTMLButtonElement };
  expect(element.element.textContent).toBe("");
  expect(element.element.getAttribute("aria-label")).toBe(`${ENTRY_TEST_PLACES[0].name} 방문`);
  expect(element.element.querySelector("img")?.getAttribute("src")).toBe(
    ENTRY_TEST_PLACES[0].imageUrl
  );
  element.element.click();
  expect(approach).toHaveBeenCalledWith(first.position);
  expect(destination).toMatchObject({ x: first.position.x, z: first.position.z });
  expect(loadEntryExplorationGltf).not.toHaveBeenCalled();
  scenery.dispose();
  expect(scenery.landmarks.size).toBe(0);
});

test("keeps a place visitable with its API image when its mapped GLB fails", async () => {
  vi.mocked(loadEntryExplorationGltf).mockRejectedValue(new Error("failed"));
  const place = { ...ENTRY_TEST_PLACES[0], id: "smart-seoul:1786321258890:25_edition25_24" };
  const scenery = createEntryEditionScenery([place], vi.fn());
  await vi.waitFor(() => {
    const label = scenery.landmarks.get(place.id)!.children[0] as THREE.Object3D & {
      element: HTMLElement;
    };
    expect(label.element.querySelector("img")).not.toBeNull();
  });
  expect(loadEntryExplorationGltf).toHaveBeenCalledWith(
    "/models/places/namsan_baekbeom_square.glb"
  );
  scenery.dispose();
});

test("loads the given model URL instead of the registered one", () => {
  vi.mocked(loadEntryExplorationGltf).mockReturnValue(new Promise(() => {}));
  const place = { ...ENTRY_TEST_PLACES[0], id: "smart-seoul:1786321258890:25_edition25_24" };
  const scenery = createEntryEditionScenery([place], vi.fn(), {
    [place.id]: { url: "blob:designer-model", size: 5.5, rotationY: 0, editionIndex: 0 },
  });
  expect(loadEntryExplorationGltf).toHaveBeenCalledWith("blob:designer-model");
  scenery.dispose();
});

test("puts each modeled place in its own edition slot and guides to the first filled slot", () => {
  vi.mocked(loadEntryExplorationGltf).mockReturnValue(new Promise(() => {}));
  const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 390 / 844);
  const places = [...ENTRY_MODELED_TEST_PLACES].reverse();
  const scenery = createEntryEditionScenery(places, vi.fn());

  expect(scenery.applyLayout(layout)).toEqual(layout.edition[0]);
  for (const place of places) {
    const landmark = scenery.landmarks.get(place.id)!;
    expect(layout.edition[ENTRY_EDITION_MODELS[place.id].editionIndex]).toMatchObject({
      x: landmark.position.x,
      z: landmark.position.z,
    });
  }
  scenery.dispose();

  const withoutFirstSlot = places.filter(
    (place) => ENTRY_EDITION_MODELS[place.id].editionIndex !== 0
  );
  const partial = createEntryEditionScenery(withoutFirstSlot, vi.fn());
  expect(partial.applyLayout(layout)).toEqual(layout.edition[1]);
  partial.dispose();
});
