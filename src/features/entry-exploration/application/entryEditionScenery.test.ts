import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { createEntryEditionScenery } from "./entryEditionScenery";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";

vi.mock("./entryExplorationGltfLoader", () => ({ loadEntryExplorationGltf: vi.fn() }));
afterEach(() => vi.resetAllMocks());

test("shows API images without captions and connects image buttons to scene destinations", () => {
  const approach = vi.fn();
  const scenery = createEntryEditionScenery(ENTRY_TEST_PLACES, approach);
  const destination = scenery.positionAtEntry(390 / 844);
  const first = scenery.landmarks.get(ENTRY_TEST_PLACES[0].id)!;
  const element = first.children[0] as THREE.Object3D & { element: HTMLButtonElement };
  expect(element.element.textContent).toBe("");
  expect(element.element.getAttribute("aria-label")).toBe(`${ENTRY_TEST_PLACES[0].name} 방문`);
  expect(element.element.querySelector("img")?.getAttribute("src")).toBe(
    ENTRY_TEST_PLACES[0].imageUrl
  );
  element.element.click();
  expect(approach).toHaveBeenCalledWith(first.position);
  expect(destination).toEqual({ x: first.position.x, z: first.position.z });
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
