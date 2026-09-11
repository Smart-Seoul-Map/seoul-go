import { ENTRY_EXPLORATION_ARCHERY_RANGE } from "./entryExplorationArcheryRange";
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
    position: { x: 18, z: 52 },
    rotationY: 0,
    size: { width: 14, depth: 9.55 },
    type: "floorOverlay",
    yOffset: 0.05,
  },
  {
    assetKey: "seoulTileMapBackground",
    id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID,
    position: { x: 33.33, z: 28.32 },
    rotationY: 0,
    size: { width: 26, depth: 14.12 },
    type: "floorOverlay",
    yOffset: 0.035,
  },
  {
    assetKey: "seoulTileMap",
    id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
    interaction: {
      triggerRadius: ENTRY_EXPLORATION_ARCHERY_RANGE.triggerRadius,
    },
    position: { x: 34.43, z: 28.67 },
    rotationY: 0,
    size: { width: 12, depth: 9.79 },
    type: "floorOverlay",
    yOffset: 0.042,
  },
] as const satisfies readonly EntryExplorationSceneObject[];
