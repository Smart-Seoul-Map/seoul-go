import line2RouteMapUrl from "../../../assets/entry-exploration/line2-route-map.png";
import floorTextureUrl from "../../../assets/textures/tile.webp";
import introBackgroundUrl from "../../../assets/entry-exploration/intro-background.png";
type EntryExplorationTextureAsset = {
  src: string;
};

export const ENTRY_EXPLORATION_TEXTURE_ASSETS = {
  floor: {
    src: floorTextureUrl,
  },
  line2RouteMap: {
    src: line2RouteMapUrl,
  },
  introBackground: {
    src: introBackgroundUrl,
  },
} as const satisfies Record<string, EntryExplorationTextureAsset>;

export type EntryExplorationTextureAssetKey = keyof typeof ENTRY_EXPLORATION_TEXTURE_ASSETS;
export type EntryExplorationSceneObjectAssetKey = Exclude<EntryExplorationTextureAssetKey, "floor">;
