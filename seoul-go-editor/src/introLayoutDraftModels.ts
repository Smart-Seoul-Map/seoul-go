import type { EntryEditionModel } from "../../src/features/entry-exploration/config/entryEditionModels";
import type { EntryIntroLayoutDocument } from "../../src/features/entry-exploration/config/entryIntroLayout";

export type IntroLayoutDraftModelUrls = Readonly<Record<string, string>>;

export const INTRO_LAYOUT_DRAFT_MODEL: Omit<EntryEditionModel, "url"> = { size: 6, rotationY: 0 };

export function getMissingIntroLayoutDraftModelAssets(
  document: EntryIntroLayoutDocument,
  urls: IntroLayoutDraftModelUrls
): string[] {
  const missing = document.nodes.flatMap((node) =>
    node.kind === "draftModel" && node.asset && !urls[node.asset] ? [node.asset] : []
  );

  return [...new Set(missing)].sort();
}
