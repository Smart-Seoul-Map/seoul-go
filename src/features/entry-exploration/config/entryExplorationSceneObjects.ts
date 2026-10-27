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
export const ENTRY_EXPLORATION_ROULETTE_TILE_MAP_OBJECT_ID = "seoul-tile-map-roulette-floor-sketch";
export const ENTRY_EXPLORATION_ROULETTE_TILE_MAP_BACKGROUND_OBJECT_ID =
  "seoul-tile-map-roulette-background-floor-sketch";

const SEOUL_TILE_MAP_BACKGROUND_OBJECT = {
  assetKey: "seoulTileMapBackground",
  rotationY: 0,
  size: { width: 26, depth: 14.12 },
  type: "floorOverlay",
  yOffset: 0.035,
} as const;

const SEOUL_TILE_MAP_OBJECT = {
  assetKey: "seoulTileMap",
  interaction: {
    triggerRadius: ENTRY_EXPLORATION_ARCHERY_RANGE.triggerRadius,
  },
  rotationY: 0,
  size: { width: 12, depth: 9.79 },
  type: "floorOverlay",
  yOffset: 0.042,
} as const;

export const ENTRY_EXPLORATION_SCENE_OBJECTS = [
  {
    ...SEOUL_TILE_MAP_BACKGROUND_OBJECT,
    id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID,
  },
  { ...SEOUL_TILE_MAP_OBJECT, id: ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID },
  {
    ...SEOUL_TILE_MAP_BACKGROUND_OBJECT,
    id: ENTRY_EXPLORATION_ROULETTE_TILE_MAP_BACKGROUND_OBJECT_ID,
  },
  { ...SEOUL_TILE_MAP_OBJECT, id: ENTRY_EXPLORATION_ROULETTE_TILE_MAP_OBJECT_ID },
] as const satisfies readonly EntryExplorationSceneObject[];
