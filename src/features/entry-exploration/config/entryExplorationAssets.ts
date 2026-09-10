import dartArrowUrl from "../../../assets/entry-exploration/arrow-done.png";
import dartCrosshairUrl from "../../../assets/entry-exploration/dart-crosshair.png";
import introBackgroundUrl from "../../../assets/entry-exploration/intro-background.png";
import line2RouteMapUrl from "../../../assets/entry-exploration/line2-route-map.png";
import seoulTileMapBackgroundUrl from "../../../assets/entry-exploration/seoul-grid-map-background.webp";
import seoulTileMapUrl from "../../../assets/entry-exploration/seoul-grid-map.svg";
import floorTextureUrl from "../../../assets/textures/tile.webp";

type EntryExplorationTextureAsset = {
  src: string;
};

export const ENTRY_EXPLORATION_TEXTURE_ASSETS = {
  dartArrow: {
    src: dartArrowUrl,
  },
  dartCrosshair: {
    src: dartCrosshairUrl,
  },
  floor: {
    src: floorTextureUrl,
  },
  introBackground: {
    src: introBackgroundUrl,
  },
  line2RouteMap: {
    src: line2RouteMapUrl,
  },
  seoulTileMap: {
    src: seoulTileMapUrl,
  },
  seoulTileMapBackground: {
    src: seoulTileMapBackgroundUrl,
  },
} as const satisfies Record<string, EntryExplorationTextureAsset>;

export type EntryExplorationTextureAssetKey = keyof typeof ENTRY_EXPLORATION_TEXTURE_ASSETS;
export type EntryExplorationSceneObjectAssetKey = Exclude<EntryExplorationTextureAssetKey, "floor">;
