import {
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
} from "../../src/features/entry-exploration/config/entryExplorationSceneObjects";
import type { IntroLayoutItemKind } from "./introLayoutTree";

export const ENTRY_INTRO_LAYOUT_SAVE_ENDPOINT = "/__dev/entry-intro-layout";

export const INTRO_LAYOUT_EDITOR_CAN_SAVE = import.meta.env.DEV;

export const ENTRY_INTRO_LAYOUT_EXPORT_FILE_NAME = "entryIntroLayout.json";

const INTRO_LAYOUT_STAGE_QUERY_KEY = "stage";
const INTRO_LAYOUT_STAGE_VIEWS = ["pc", "mobile", "preview"] as const;

export type IntroLayoutStageView = (typeof INTRO_LAYOUT_STAGE_VIEWS)[number];

export function readIntroLayoutStageView(search: string): IntroLayoutStageView | null {
  const value = new URLSearchParams(search).get(INTRO_LAYOUT_STAGE_QUERY_KEY);

  return INTRO_LAYOUT_STAGE_VIEWS.find((view) => view === value) ?? null;
}

export function createIntroLayoutStageSrc(view: IntroLayoutStageView): string {
  return `?${INTRO_LAYOUT_STAGE_QUERY_KEY}=${view}`;
}

export const INTRO_LAYOUT_PREVIEW_PRESETS = [
  { id: "tablet-portrait", width: 768, height: 1024 },
  { id: "tablet-landscape", width: 1024, height: 768 },
  { id: "laptop", width: 1440, height: 900 },
] as const;

export type IntroLayoutPreviewPresetId = (typeof INTRO_LAYOUT_PREVIEW_PRESETS)[number]["id"];

export const DEFAULT_INTRO_LAYOUT_PREVIEW_PRESET_ID: IntroLayoutPreviewPresetId =
  "tablet-landscape";

export const INTRO_LAYOUT_FIRST_PLACE_SHIFT_TOLERANCE = 0.001;

export const INTRO_LAYOUT_FIXED_ITEM_LABELS: Readonly<Record<string, string>> = {
  "archery-range": "활쏘기장",
  "intro-background": "인트로 바닥 배경",
  "slot-machine": "슬롯머신",
  [ENTRY_EXPLORATION_SEOUL_TILE_MAP_BACKGROUND_OBJECT_ID]: "서울 타일맵 배경",
  [ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID]: "서울 타일맵",
};

export const INTRO_LAYOUT_ITEM_KIND_LABELS: Readonly<Record<IntroLayoutItemKind, string>> = {
  model: "3D",
  fixed: "물체",
  group: "그룹",
  sticker: "스티커",
};
