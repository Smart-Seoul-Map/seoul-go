import {
  ENTRY_INTRO_LAYOUT_EDITION_ID_PREFIX,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutView,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import type { EntryExplorationScenePoint } from "../../src/features/entry-exploration/domain/entryExplorationSceneMath";
import type { IntroLayoutModelUrls } from "./introLayoutModels";

const INTRO_LAYOUT_EDITOR_CHANNEL = "seoul-go:intro-layout-editor";

export type IntroLayoutItemId = string;

export type IntroLayoutCameraPreset = "arrival" | "intro";

export type IntroLayoutArrivalTarget = {
  id: IntroLayoutItemId;
  name: string;
};

export type IntroLayoutShellMessage =
  | {
      type: "state";
      document: EntryIntroLayoutDocument;
      selectedIds: readonly IntroLayoutItemId[];
    }
  | { type: "focus"; arrivalId: IntroLayoutItemId | null }
  | { type: "camera"; preset: IntroLayoutCameraPreset }
  | { type: "floor"; textureUrl: string | null }
  | { type: "models"; urls: IntroLayoutModelUrls };

export type IntroLayoutStageMessage =
  | { type: "ready"; arrivalTargets: readonly IntroLayoutArrivalTarget[] }
  | { type: "select"; id: IntroLayoutItemId }
  | {
      type: "move";
      view: EntryIntroLayoutView;
      id: IntroLayoutItemId;
      point: EntryExplorationScenePoint;
    }
  | { type: "closeArrival" };

export function toEditionItemId(index: number): IntroLayoutItemId {
  return `${ENTRY_INTRO_LAYOUT_EDITION_ID_PREFIX}${index}`;
}

export function isEditionItemId(id: IntroLayoutItemId): boolean {
  return id.startsWith(ENTRY_INTRO_LAYOUT_EDITION_ID_PREFIX);
}

export function getEditionIndex(id: IntroLayoutItemId): number {
  return Number(id.slice(ENTRY_INTRO_LAYOUT_EDITION_ID_PREFIX.length));
}

export function postIntroLayoutShellMessage(
  target: Window,
  message: IntroLayoutShellMessage
): void {
  target.postMessage({ channel: INTRO_LAYOUT_EDITOR_CHANNEL, message }, window.location.origin);
}

export function postIntroLayoutStageMessage(message: IntroLayoutStageMessage): void {
  window.parent.postMessage(
    { channel: INTRO_LAYOUT_EDITOR_CHANNEL, message },
    window.location.origin
  );
}

export function readIntroLayoutShellMessage(
  event: MessageEvent<unknown>
): IntroLayoutShellMessage | null {
  if (event.source !== window.parent) {
    return null;
  }

  return readIntroLayoutMessage(event) as IntroLayoutShellMessage | null;
}

export function readIntroLayoutStageMessage(
  event: MessageEvent<unknown>
): IntroLayoutStageMessage | null {
  return readIntroLayoutMessage(event) as IntroLayoutStageMessage | null;
}

function readIntroLayoutMessage(event: MessageEvent<unknown>): unknown {
  const { data } = event;

  if (event.origin !== window.location.origin || typeof data !== "object" || data === null) {
    return null;
  }

  if (
    !("channel" in data) ||
    data.channel !== INTRO_LAYOUT_EDITOR_CHANNEL ||
    !("message" in data)
  ) {
    return null;
  }

  return data.message;
}
