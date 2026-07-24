import haechiAndFriendsUrl from "../../../assets/entry-exploration/haechi-and-friends.png";
import jangjiCheonPostcardUrl from "../../../assets/entry-exploration/jangji-cheon-postcard.png";
import line2RouteMapUrl from "../../../assets/entry-exploration/line2-route-map.png";
import namsanTowerUrl from "../../../assets/entry-exploration/namsan-tower.png";
import floorTextureUrl from "../../../assets/textures/tile.jpeg";

type EntryExplorationTextureAsset = {
  src: string;
};

export const ENTRY_EXPLORATION_TEXTURE_ASSETS = {
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
} as const satisfies Record<string, EntryExplorationTextureAsset>;

export type EntryExplorationTextureAssetKey = keyof typeof ENTRY_EXPLORATION_TEXTURE_ASSETS;
export type EntryExplorationSceneObjectAssetKey = Exclude<EntryExplorationTextureAssetKey, "floor">;
