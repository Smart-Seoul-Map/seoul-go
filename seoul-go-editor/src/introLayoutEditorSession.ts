import {
  ENTRY_INTRO_LAYOUTS,
  type EntryIntroLayoutView,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import {
  DEFAULT_INTRO_LAYOUT_PREVIEW_PRESET_ID,
  INTRO_LAYOUT_PREVIEW_PRESETS,
  type IntroLayoutPreviewPresetId,
} from "./introLayoutEditorConfig";
import type { IntroLayoutItemId } from "./introLayoutEditorMessages";
import { getIntroLayoutItemKind } from "./introLayoutTree";

const INTRO_LAYOUT_EDITOR_SESSION_KEY = "seoul-go:intro-layout-editor";

export type IntroLayoutEditorSession = {
  view: EntryIntroLayoutView;
  selectedIds: readonly IntroLayoutItemId[];
  previewPresetId: IntroLayoutPreviewPresetId;
  saveResult: string | null;
};

export function readIntroLayoutEditorSession(): IntroLayoutEditorSession {
  const stored = parseStoredSession(readSessionValue());
  const previewPreset = INTRO_LAYOUT_PREVIEW_PRESETS.find(
    ({ id }) => id === stored.previewPresetId
  );
  const selectedIds = Array.isArray(stored.selectedIds)
    ? stored.selectedIds.filter(
        (id): id is string =>
          typeof id === "string" && getIntroLayoutItemKind(ENTRY_INTRO_LAYOUTS, id) !== null
      )
    : [];

  return {
    view: stored.view === "mobile" ? "mobile" : "pc",
    selectedIds,
    previewPresetId: previewPreset?.id ?? DEFAULT_INTRO_LAYOUT_PREVIEW_PRESET_ID,
    saveResult: typeof stored.saveResult === "string" ? stored.saveResult : null,
  };
}

export function writeIntroLayoutEditorSession(session: IntroLayoutEditorSession): void {
  try {
    sessionStorage.setItem(INTRO_LAYOUT_EDITOR_SESSION_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

function readSessionValue(): string | null {
  try {
    return sessionStorage.getItem(INTRO_LAYOUT_EDITOR_SESSION_KEY);
  } catch {
    return null;
  }
}

function parseStoredSession(value: string | null): Partial<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(value ?? "null");

    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
