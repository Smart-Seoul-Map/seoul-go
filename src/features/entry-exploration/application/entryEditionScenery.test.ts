import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import { resolveEntryIntroLayout } from "../domain/entryIntroLayout";
import { ENTRY_MODELED_TEST_PLACES, ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { createEntryEditionScenery } from "./entryEditionScenery";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";

vi.mock("./entryExplorationGltfLoader", () => ({ loadEntryExplorationGltf: vi.fn() }));
afterEach(() => vi.resetAllMocks());

test("shows API images without captions and connects image buttons to scene destinations", () => {
  const approach = vi.fn();
  const [firstPlace, secondPlace] = ENTRY_MODELED_TEST_PLACES;
  const scenery = createEntryEditionScenery([firstPlace, secondPlace], approach, {});
  const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 390 / 844);
  const destination = scenery.applyLayout(layout);
  const first = scenery.landmarks.get(firstPlace.id)!;
  const second = scenery.landmarks.get(secondPlace.id)!;
  expect(layout.models[firstPlace.id]).toMatchObject({ x: first.position.x, z: first.position.z });
  expect(layout.models[secondPlace.id]).toMatchObject({
    x: second.position.x,
    z: second.position.z,
  });
  const element = first.children[0] as THREE.Object3D & { element: HTMLButtonElement };
  expect(element.element.textContent).toBe("");
  expect(element.element.getAttribute("aria-label")).toBe(`${firstPlace.name} 방문`);
  expect(element.element.querySelector("img")?.getAttribute("src")).toBe(firstPlace.imageUrl);
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
    [place.id]: { url: "blob:designer-model", size: 5.5, rotationY: 0 },
  });
  expect(loadEntryExplorationGltf).toHaveBeenCalledWith("blob:designer-model");
  scenery.dispose();
});

test("puts each modeled place at its own model position and guides to the chosen guide model", () => {
  vi.mocked(loadEntryExplorationGltf).mockReturnValue(new Promise(() => {}));
  const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 390 / 844);
  const places = [...ENTRY_MODELED_TEST_PLACES].reverse();
  const scenery = createEntryEditionScenery(places, vi.fn());

  expect(scenery.applyLayout(layout)).toEqual(layout.models[layout.guidePlaceId]);
  for (const place of places) {
    const landmark = scenery.landmarks.get(place.id)!;
    expect(layout.models[place.id]).toMatchObject({
      x: landmark.position.x,
      z: landmark.position.z,
    });
  }
  scenery.dispose();

  const withoutGuide = ENTRY_MODELED_TEST_PLACES.filter(
    (place) => place.id !== layout.guidePlaceId
  );
  const partial = createEntryEditionScenery(withoutGuide, vi.fn());
  expect(partial.applyLayout(layout)).toEqual(layout.models[withoutGuide[0].id]);
  partial.dispose();
});

test("hides a place that has no model position in the layout", () => {
  const scenery = createEntryEditionScenery([ENTRY_TEST_PLACES[0]], vi.fn());
  const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 390 / 844);

  expect(scenery.applyLayout(layout)).toBeNull();
  expect(scenery.landmarks.get(ENTRY_TEST_PLACES[0].id)?.visible).toBe(false);
  scenery.dispose();
});
