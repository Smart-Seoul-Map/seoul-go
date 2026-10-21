import { expect, test, vi } from "vitest";

import {
  getIntroLayoutStickerAssets,
  getIntroLayoutStickerUrls,
  getMissingIntroLayoutStickerAssets,
} from "./introLayoutStickers";

vi.mock("../../src/features/entry-exploration/config/entryExplorationStickers", () => ({
  ENTRY_EXPLORATION_STICKER_URLS: { "star.png": "/star.png", "pine.png": "/pine.png" },
}));

test("adds uploaded images to the sticker folder and lets them replace a file of the same name", () => {
  const uploaded = { "pine.png": "blob:new-pine", "cloud.webp": "blob:cloud" };

  expect(getIntroLayoutStickerUrls(uploaded)).toEqual({
    "star.png": "/star.png",
    "pine.png": "blob:new-pine",
    "cloud.webp": "blob:cloud",
  });
  expect(getIntroLayoutStickerAssets(uploaded)).toEqual(["cloud.webp", "pine.png", "star.png"]);
  expect(getIntroLayoutStickerAssets({})).toEqual(["pine.png", "star.png"]);
});

test("lists each sticker image a layout needs but the editor does not have", () => {
  const value = {
    nodes: [
      { id: "sticker-1", kind: "sticker", asset: "tree.png" },
      { id: "sticker-2", kind: "sticker", asset: "star.png" },
      { id: "sticker-3", kind: "sticker", asset: "tree.png" },
      { id: "sticker-4", kind: "sticker", asset: "bush.webp" },
      { id: "group-1", kind: "group" },
    ],
  };

  expect(getMissingIntroLayoutStickerAssets(value, ["star.png"])).toEqual([
    "bush.webp",
    "tree.png",
  ]);
  expect(getMissingIntroLayoutStickerAssets(value, ["star.png", "tree.png", "bush.webp"])).toEqual(
    []
  );
});

test("finds nothing missing in values that are not layouts", () => {
  expect(getMissingIntroLayoutStickerAssets(null, [])).toEqual([]);
  expect(getMissingIntroLayoutStickerAssets({ nodes: "x" }, [])).toEqual([]);
  expect(getMissingIntroLayoutStickerAssets([], [])).toEqual([]);
});
