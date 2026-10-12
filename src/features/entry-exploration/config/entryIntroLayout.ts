import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import entryIntroLayouts from "./entryIntroLayout.json";

export type EntryIntroLayoutView = "mobile" | "pc";

export type EntryIntroLayoutObjectId = keyof typeof entryIntroLayouts.pc.objects;

export type EntryIntroLayout = {
  edition: readonly EntryExplorationScenePoint[];
  objects: Readonly<Record<EntryIntroLayoutObjectId, EntryExplorationScenePoint>>;
};

export type EntryIntroLayouts = Readonly<Record<EntryIntroLayoutView, EntryIntroLayout>>;

export const ENTRY_INTRO_LAYOUTS: EntryIntroLayouts = entryIntroLayouts;

export const ENTRY_INTRO_LAYOUT_VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  pc: { width: 1920, height: 1080 },
} as const satisfies Record<EntryIntroLayoutView, { width: number; height: number }>;
