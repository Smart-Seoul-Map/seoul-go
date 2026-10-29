import manifest from "../../../assets/entry-exploration/intro-atlas.json";

export type EntryAtlasKey = keyof typeof manifest.frames;
type EntryExplorationSceneryObject = {
  key: EntryAtlasKey;
  width: number;
};

export const ENTRY_EXPLORATION_SCENERY_OBJECTS = [
  { key: "hanok", width: 7.5 },
  { key: "bench", width: 2.6 },
  { key: "streetlamp", width: 1.6 },
  { key: "park", width: 11 },
  { key: "waterfront", width: 8 },
  { key: "store", width: 8 },
  { key: "subway", width: 7 },
  { key: "busstop", width: 6 },
  { key: "bus", width: 4.5 },
  { key: "sparkle", width: 0.65 },
  { key: "flower", width: 0.85 },
  { key: "pinkStar", width: 0.75 },
  { key: "hanokSticker", width: 2.2 },
  { key: "cloud", width: 1.2 },
  { key: "blueStar", width: 0.7 },
  { key: "pinkSparkles", width: 0.8 },
] as const satisfies readonly EntryExplorationSceneryObject[];
