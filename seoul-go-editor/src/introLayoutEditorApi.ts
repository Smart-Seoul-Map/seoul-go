import { isHTTPError } from "ky";

import { kyClient } from "@shared/lib/http/kyClient";

import type { EntryIntroLayoutDocument } from "../../src/features/entry-exploration/config/entryIntroLayout";
import { ENTRY_INTRO_LAYOUT_SAVE_ENDPOINT } from "./introLayoutEditorConfig";

export async function postEntryIntroLayouts(document: EntryIntroLayoutDocument): Promise<void> {
  await kyClient.post(ENTRY_INTRO_LAYOUT_SAVE_ENDPOINT, { json: document });
}

export function getEntryIntroLayoutSaveErrorMessage(error: unknown): string {
  if (isHTTPError(error)) {
    return `반영 실패 (HTTP ${error.response.status})`;
  }

  return "반영 실패 (편집기 서버 연결을 확인하세요)";
}
