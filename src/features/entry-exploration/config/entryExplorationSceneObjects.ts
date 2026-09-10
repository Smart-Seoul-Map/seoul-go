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
export const ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID = "seoul-tile-map-floor-sketch";
export const ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID =
  "seoul-tile-map-background-floor-sketch";

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
  {
    assetKey: "seoulTileMapBackground",
    id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID,
    position: { x: 29.15, z: 19.65 },
    rotationY: 0,
    size: { width: 26, depth: 14.12 },
    type: "floorOverlay",
    yOffset: 0.035,
  },
  {
    assetKey: "seoulTileMap",
    id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
    interaction: {
      triggerRadius: 5.4,
    },
    position: { x: 30.25, z: 20 },
    rotationY: 0,
    size: { width: 12, depth: 9.79 },
    type: "floorOverlay",
    yOffset: 0.042,
  },
] as const satisfies readonly EntryExplorationSceneObject[];
