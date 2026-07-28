import type { EntryExplorationSceneObjectAssetKey } from "./entryExplorationAssets";

export type EntryExplorationSceneAssetKey = EntryExplorationSceneObjectAssetKey;

export type EntryExplorationSceneObjectType = "floorOverlay" | "standingProp";

export type EntryExplorationInteractionType = "subwaySelection";

export type EntryExplorationInteraction = {
  triggerRadius: number;
  type: EntryExplorationInteractionType;
};

type EntryExplorationSceneObjectBase = {
  assetKey: EntryExplorationSceneAssetKey;
  id: string;
  interaction?: EntryExplorationInteraction;
  position: {
    x: number;
    z: number;
  };
  rotationY: number;
};

export type EntryExplorationFloorOverlayObject = EntryExplorationSceneObjectBase & {
  size: {
    width: number;
    depth: number;
  };
  type: "floorOverlay";
  yOffset: number;
};

export type EntryExplorationStandingPropObject = EntryExplorationSceneObjectBase & {
  shadow: {
    depth: number;
    opacity: number;
    width: number;
  };
  size: {
    height: number;
    width: number;
  };
  type: "standingProp";
  yOffset: number;
};

export type EntryExplorationSceneObject =
  EntryExplorationFloorOverlayObject | EntryExplorationStandingPropObject;

export const ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID = "subway-selection-route-map";

export const ENTRY_EXPLORATION_SCENE_OBJECTS = [
  {
    assetKey: "haechiAndFriends",
    id: "haechi-and-friends-floor-sketch",
    position: { x: -8, z: -8 },
    rotationY: 0,
    size: { width: 10.4, depth: 6 },
    type: "floorOverlay",
    yOffset: 0.04,
  },
  {
    assetKey: "jangjiCheonPostcard",
    id: "jangji-cheon-postcard-floor-sketch",
    position: { x: 8, z: -8 },
    rotationY: 0,
    size: { width: 5.6, depth: 7 },
    type: "floorOverlay",
    yOffset: 0.045,
  },
  {
    assetKey: "line2RouteMap",
    id: ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID,
    interaction: {
      triggerRadius: 5.2,
      type: "subwaySelection",
    },
    position: { x: 18, z: 6 },
    rotationY: 0,
    size: { width: 14, depth: 9.55 },
    type: "floorOverlay",
    yOffset: 0.05,
  },
  {
    assetKey: "namsanTower",
    id: "namsan-tower-landmark",
    position: { x: -9.4, z: 6.8 },
    rotationY: 0,
    shadow: { width: 2.05, depth: 1.25, opacity: 0.16 },
    size: { width: 3.1, height: 5.55 },
    type: "standingProp",
    yOffset: 2.775,
  },
] as const satisfies readonly EntryExplorationSceneObject[];
