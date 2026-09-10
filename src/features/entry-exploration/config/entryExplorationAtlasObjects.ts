import manifest from "../../../assets/entry-exploration/intro-atlas.json";

export type EntryAtlasKey = keyof typeof manifest.frames;
type AtlasPlacement = {
  key: EntryAtlasKey;
  offset: { x: number; z: number };
  width: number;
};

export const ENTRY_EXPLORATION_LANDMARK_LAYOUT = {
  hanokEntryViewportX: 0.95,
  towerEntryEdgeOffset: 3,
  towerForwardOffset: 25,
} as const;

// Offsets are relative to the fixed intro arrival point, not the moving character.
export const ENTRY_EXPLORATION_ATLAS_OBJECTS = [
  { key: "bench", offset: { x: -2, z: 7 }, width: 2.6 },
  { key: "streetlamp", offset: { x: 5, z: -3 }, width: 1.6 },
  { key: "tower", offset: { x: 19, z: 15 }, width: 4.8 },
  { key: "park", offset: { x: -18, z: -10 }, width: 11 },
  { key: "waterfront", offset: { x: -32, z: 5 }, width: 13 },
  { key: "store", offset: { x: 15, z: -12 }, width: 8 },
  { key: "office", offset: { x: 29, z: -16 }, width: 6 },
  { key: "city", offset: { x: 31, z: -32 }, width: 11 },
  { key: "hanok", offset: { x: 12, z: 24 }, width: 7.5 },
  { key: "bicycle", offset: { x: 11, z: -6 }, width: 2.3 },
  { key: "pin", offset: { x: -12, z: -6 }, width: 0.65 },
  { key: "emphasis", offset: { x: 19, z: -10 }, width: 0.9 },
  { key: "sparkle", offset: { x: -23, z: 8 }, width: 0.65 },
  { key: "flower", offset: { x: 8, z: 16 }, width: 0.85 },
  { key: "pinkStar", offset: { x: 6, z: 9 }, width: 0.75 },
  { key: "hanokSticker", offset: { x: 5, z: 22 }, width: 2.2 },
  { key: "cloud", offset: { x: -20, z: -5 }, width: 1.2 },
  { key: "blueStar", offset: { x: 22, z: -23 }, width: 0.7 },
  { key: "pinkSparkles", offset: { x: -5, z: -4 }, width: 0.8 },
] as const satisfies readonly AtlasPlacement[];
