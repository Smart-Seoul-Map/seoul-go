import { ENTRY_EXPLORATION_ARCHERY_RANGE } from "./entryExplorationArcheryRange";
import type { EntryExplorationSceneObjectAssetKey } from "./entryExplorationAssets";

export type EntryExplorationInteraction = {
  triggerRadius: number;
};

type EntryExplorationSceneObjectBase = {
  assetKey: EntryExplorationSceneObjectAssetKey;
  id: string;
  interaction?: EntryExplorationInteraction;
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

export const ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID = "seoul-tile-map-floor-sketch";
export const ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID =
  "seoul-tile-map-background-floor-sketch";

export const ENTRY_EXPLORATION_SCENE_OBJECTS = [
  {
    assetKey: "seoulTileMapBackground",
    id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID,
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
    rotationY: 0,
    size: { width: 12, depth: 9.79 },
    type: "floorOverlay",
    yOffset: 0.042,
  },
] as const satisfies readonly EntryExplorationSceneObject[];
