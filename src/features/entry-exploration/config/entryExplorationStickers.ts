const STICKER_URLS_BY_PATH = import.meta.glob<string>(
  "../../../assets/entry-exploration/stickers/*.{png,webp}",
  { eager: true, import: "default", query: "?url" }
);

export const ENTRY_EXPLORATION_STICKER_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(STICKER_URLS_BY_PATH).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1),
    url,
  ])
);

export const ENTRY_EXPLORATION_STICKER_ASSETS: readonly string[] = Object.keys(
  ENTRY_EXPLORATION_STICKER_URLS
).sort();

export const ENTRY_EXPLORATION_STICKER_BASE_WIDTH = 1.2;
