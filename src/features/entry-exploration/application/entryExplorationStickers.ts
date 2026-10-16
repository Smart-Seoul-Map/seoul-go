import * as THREE from "three";

import {
  ENTRY_EXPLORATION_STICKER_BASE_WIDTH,
  ENTRY_EXPLORATION_STICKER_URLS,
} from "../config/entryExplorationStickers";
import type { EntryIntroLayout } from "../config/entryIntroLayout";
import {
  createEntryExplorationFacing,
  placeEntryExplorationStandingObject,
} from "./entryExplorationScenery";

const STICKER_SURFACE_HEIGHT = 0.06;
const STICKER_NAME_PREFIX = "entry-sticker-";

type StickerAsset = {
  material: THREE.MeshBasicMaterial;
  texture: THREE.Texture;
  aspect: number;
};

export type EntryExplorationStickers = ReturnType<typeof createEntryExplorationStickers>;

export function getEntryExplorationStickerId(object: THREE.Object3D): string | null {
  return object.name.startsWith(STICKER_NAME_PREFIX)
    ? object.name.slice(STICKER_NAME_PREFIX.length)
    : null;
}

export function createEntryExplorationStickers() {
  const facing = createEntryExplorationFacing();
  const object = new THREE.Group();
  object.name = "entry-stickers";
  const geometry = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const loader = new THREE.TextureLoader();
  const assets = new Map<string, StickerAsset>();
  const holders = new Map<string, THREE.Group>();

  const resizeHolder = (holder: THREE.Group, asset: StickerAsset): void => {
    holder.children[0]?.scale.set(
      ENTRY_EXPLORATION_STICKER_BASE_WIDTH,
      ENTRY_EXPLORATION_STICKER_BASE_WIDTH * asset.aspect,
      1
    );
  };

  const getAsset = (key: string): StickerAsset | null => {
    const known = assets.get(key);

    if (known) return known;

    const url = ENTRY_EXPLORATION_STICKER_URLS[key];

    if (!url) return null;

    const material = new THREE.MeshBasicMaterial({
      alphaTest: 0.08,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    });
    const asset: StickerAsset = {
      material,
      aspect: 1,
      texture: loader.load(url, (texture) => {
        const image = texture.image as { width?: number; height?: number } | undefined;

        if (image?.width && image.height) asset.aspect = image.height / image.width;

        holders.forEach((holder) => {
          if (holder.userData.asset === key) resizeHolder(holder, asset);
        });
      }),
    };
    asset.texture.colorSpace = THREE.SRGBColorSpace;
    material.map = asset.texture;
    assets.set(key, asset);

    return asset;
  };

  const getHolder = (id: string, key: string, asset: StickerAsset): THREE.Group => {
    const current = holders.get(id);

    if (current?.userData.asset === key) return current;

    current?.removeFromParent();
    const holder = new THREE.Group();
    const plane = new THREE.Mesh(geometry, asset.material);

    holder.name = `${STICKER_NAME_PREFIX}${id}`;
    holder.userData.asset = key;
    plane.name = holder.name;
    holder.add(plane);
    resizeHolder(holder, asset);
    object.add(holder);
    holders.set(id, holder);

    return holder;
  };

  return {
    object,
    applyLayout(layout: EntryIntroLayout): void {
      const visibleIds = new Set<string>();

      layout.stickers.forEach((sticker) => {
        const asset = getAsset(sticker.asset);

        if (!asset) return;

        const holder = getHolder(sticker.id, sticker.asset, asset);

        holder.position.y = STICKER_SURFACE_HEIGHT;
        placeEntryExplorationStandingObject(holder, facing, sticker.placement);
        visibleIds.add(sticker.id);
      });

      holders.forEach((holder, id) => {
        if (visibleIds.has(id)) return;

        holder.removeFromParent();
        holders.delete(id);
      });
    },
    dispose(): void {
      object.removeFromParent();
      object.clear();
      holders.clear();
      geometry.dispose();
      assets.forEach(({ material, texture }) => {
        material.dispose();
        texture.dispose();
      });
      assets.clear();
    },
  };
}
