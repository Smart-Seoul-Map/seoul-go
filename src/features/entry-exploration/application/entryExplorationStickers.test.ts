import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import {
  createEntryExplorationStickers,
  getEntryExplorationStickerId,
} from "./entryExplorationStickers";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import { resolveEntryIntroLayoutView } from "../domain/entryIntroLayout";

vi.mock("../config/entryExplorationStickers", () => ({
  ENTRY_EXPLORATION_STICKER_BASE_WIDTH: 1.2,
  ENTRY_EXPLORATION_STICKER_URLS: { "star.png": "/star.png" },
}));

afterEach(() => vi.restoreAllMocks());

test("places stickers from the layout, skips unknown images and removes stickers that leave the layout", () => {
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockReturnValue(new THREE.Texture());
  const stickers = createEntryExplorationStickers();
  const layout = resolveEntryIntroLayoutView(ENTRY_INTRO_LAYOUTS, "pc");
  const placement = { x: 4, z: -3, scale: 2, rotation: 30 };

  stickers.applyLayout({
    ...layout,
    stickers: [
      { id: "sticker-1", asset: "star.png", placement },
      { id: "sticker-2", asset: "missing.png", placement },
    ],
  });

  const holder = stickers.object.getObjectByName("entry-sticker-sticker-1");

  expect(stickers.object.children).toHaveLength(1);
  expect(holder?.position.x).toBe(4);
  expect(holder?.position.z).toBe(-3);
  expect(holder?.scale.x).toBe(2);
  expect(getEntryExplorationStickerId(holder!.children[0])).toBe("sticker-1");
  expect(getEntryExplorationStickerId(stickers.object)).toBeNull();

  stickers.applyLayout(layout);

  expect(stickers.object.children).toHaveLength(0);
  stickers.dispose();
});

test("loads images from the given URLs instead of the sticker folder", () => {
  const load = vi.spyOn(THREE.TextureLoader.prototype, "load").mockReturnValue(new THREE.Texture());
  const stickers = createEntryExplorationStickers({ "pine.png": "blob:designer-sticker" });
  const layout = resolveEntryIntroLayoutView(ENTRY_INTRO_LAYOUTS, "pc");
  const placement = { x: 0, z: 0, scale: 1, rotation: 0 };

  stickers.applyLayout({
    ...layout,
    stickers: [
      { id: "sticker-1", asset: "pine.png", placement },
      { id: "sticker-2", asset: "star.png", placement },
    ],
  });

  expect(load).toHaveBeenCalledTimes(1);
  expect(load.mock.calls[0][0]).toBe("blob:designer-sticker");
  expect(stickers.object.children).toHaveLength(1);
  stickers.dispose();
});
