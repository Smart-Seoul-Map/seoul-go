import dartArrowUrl from "../../../assets/entry-exploration/arrow-done.png";
import dartCrosshairUrl from "../../../assets/entry-exploration/dart-crosshair.png";
import haechiAndFriendsUrl from "../../../assets/entry-exploration/haechi-and-friends.png";
import jangjiCheonPostcardUrl from "../../../assets/entry-exploration/jangji-cheon-postcard.png";
import line2RouteMapUrl from "../../../assets/entry-exploration/line2-route-map.png";
import namsanTowerUrl from "../../../assets/entry-exploration/namsan-tower.png";
import seoulExplorationGoUrl from "../../../assets/entry-exploration/seoul-exploration-go.png";
import seoulTileMapUrl from "../../../assets/entry-exploration/seoul-grid-map.svg";
import floorTextureUrl from "../../../assets/textures/tile.jpeg";

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
  haechiAndFriends: {
    src: haechiAndFriendsUrl,
  },
  jangjiCheonPostcard: {
    src: jangjiCheonPostcardUrl,
  },
  line2RouteMap: {
    src: line2RouteMapUrl,
  },
  namsanTower: {
    src: namsanTowerUrl,
  },
  seoulExplorationGo: {
    src: seoulExplorationGoUrl,
  },
  seoulTileMap: {
    src: seoulTileMapUrl,
  },
} as const satisfies Record<string, EntryExplorationTextureAsset>;

export type EntryExplorationTextureAssetKey = keyof typeof ENTRY_EXPLORATION_TEXTURE_ASSETS;
export type EntryExplorationSceneObjectAssetKey = Exclude<EntryExplorationTextureAssetKey, "floor">;
