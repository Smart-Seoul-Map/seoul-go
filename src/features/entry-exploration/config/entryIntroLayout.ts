import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import { ENTRY_EDITION_MODELS } from "./entryEditionModels";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
} from "./entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SCENERY_OBJECTS } from "./entryExplorationSceneryObjects";
import entryIntroLayoutDocument from "./entryIntroLayout.json";

export type EntryIntroLayoutView = "mobile" | "pc";

export const ENTRY_INTRO_LAYOUT_OBJECT_IDS = [
  ...ENTRY_EXPLORATION_SCENERY_OBJECTS.map(({ key }) => key),
  "intro-background",
  "archery-range",
  "slot-machine",
  ...ENTRY_EXPLORATION_SCENE_OBJECTS.map(({ id }) => id),
] as const;

export type EntryIntroLayoutObjectId = (typeof ENTRY_INTRO_LAYOUT_OBJECT_IDS)[number];

export const ENTRY_INTRO_LAYOUT_POSITION_ONLY_IDS: readonly string[] = [
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
  "slot-machine",
];

export const ENTRY_INTRO_LAYOUT_MODEL_ID_PREFIX = "model:";

export const ENTRY_INTRO_LAYOUT_MODEL_IDS: readonly string[] = Object.keys(
  ENTRY_EDITION_MODELS
).map((placeId) => `${ENTRY_INTRO_LAYOUT_MODEL_ID_PREFIX}${placeId}`);

export type EntryIntroLayoutTransform = EntryExplorationScenePoint & {
  scale?: number;
  rotation?: number;
};

export type EntryIntroLayoutNodeKind = "group" | "sticker";

export type EntryIntroLayoutNode = {
  id: string;
  kind?: EntryIntroLayoutNodeKind;
  parent?: string;
  asset?: string;
  name?: string;
};

export type EntryIntroLayoutViewData = {
  objects: Readonly<Record<string, EntryIntroLayoutTransform>>;
};

export type EntryIntroLayoutDocument = {
  nodes: readonly EntryIntroLayoutNode[];
  guidePlaceId: string;
  mobile: EntryIntroLayoutViewData;
  pc: EntryIntroLayoutViewData;
};

export type EntryIntroLayoutPlacement = EntryExplorationScenePoint & {
  scale: number;
  rotation: number;
};

export type EntryIntroLayoutSticker = {
  id: string;
  asset: string;
  placement: EntryIntroLayoutPlacement;
};

export type EntryIntroLayout = {
  guidePlaceId: string;
  models: Readonly<Record<string, EntryIntroLayoutPlacement>>;
  objects: Readonly<Record<EntryIntroLayoutObjectId, EntryIntroLayoutPlacement>>;
  stickers: readonly EntryIntroLayoutSticker[];
};

export const ENTRY_INTRO_LAYOUTS = entryIntroLayoutDocument as EntryIntroLayoutDocument;

export const ENTRY_INTRO_LAYOUT_VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  pc: { width: 1920, height: 1080 },
} as const satisfies Record<EntryIntroLayoutView, { width: number; height: number }>;
