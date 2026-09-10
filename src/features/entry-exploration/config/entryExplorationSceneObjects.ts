import type { EntryExplorationSceneObjectAssetKey } from "./entryExplorationAssets";

export type EntryExplorationInteraction = {
  triggerRadius: number;
};

type EntryExplorationSceneObjectBase = {
  assetKey: EntryExplorationSceneObjectAssetKey;
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

export type EntryExplorationSceneObject = EntryExplorationFloorOverlayObject;

export const ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID = "subway-selection-route-map";

export const ENTRY_EXPLORATION_SCENE_OBJECTS = [
  {
    assetKey: "line2RouteMap",
    id: ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID,
    interaction: {
      triggerRadius: 5.2,
    },
    position: { x: 18, z: 6 },
    rotationY: 0,
    size: { width: 14, depth: 9.55 },
    type: "floorOverlay",
    yOffset: 0.05,
  },
] as const satisfies readonly EntryExplorationSceneObject[];
