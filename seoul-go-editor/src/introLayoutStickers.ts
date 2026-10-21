import { ENTRY_EXPLORATION_STICKER_URLS } from "../../src/features/entry-exploration/config/entryExplorationStickers";

export type IntroLayoutStickerUrls = Readonly<Record<string, string>>;

export function getIntroLayoutStickerUrls(
  uploaded: IntroLayoutStickerUrls
): IntroLayoutStickerUrls {
  return { ...ENTRY_EXPLORATION_STICKER_URLS, ...uploaded };
}

export function getIntroLayoutStickerAssets(uploaded: IntroLayoutStickerUrls): string[] {
  return Object.keys(getIntroLayoutStickerUrls(uploaded)).sort();
}

export function getMissingIntroLayoutStickerAssets(
  value: unknown,
  assets: readonly string[]
): string[] {
  if (typeof value !== "object" || value === null || !("nodes" in value)) return [];

  const { nodes } = value;

  if (!Array.isArray(nodes)) return [];

  const missing = nodes.flatMap((node: unknown) => {
    if (typeof node !== "object" || node === null) return [];

    const { kind, asset } = node as { kind?: unknown; asset?: unknown };

    return kind === "sticker" && typeof asset === "string" && !assets.includes(asset)
      ? [asset]
      : [];
  });

  return [...new Set(missing)].sort();
}
