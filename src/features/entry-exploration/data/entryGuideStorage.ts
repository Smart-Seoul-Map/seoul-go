export const ENTRY_GUIDE_SEEN_STORAGE_KEY = "seoul-go:entry-guide-seen:v1";
export type EntryGuideStorage = Pick<Storage, "getItem" | "setItem">;

// 첫 진입 가이드를 봤는지 남긴다. 지금은 여는 판단에 쓰지 않는다(195 리뷰 반영 확정 전까지 남겨 둠).
export function hasSeenEntryGuide(
  storage: EntryGuideStorage | null = getBrowserStorage()
): boolean {
  try {
    return storage?.getItem(ENTRY_GUIDE_SEEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markEntryGuideSeen(storage: EntryGuideStorage | null = getBrowserStorage()): void {
  try {
    storage?.setItem(ENTRY_GUIDE_SEEN_STORAGE_KEY, "1");
  } catch {
    // 저장하지 못하면 다음 진입에 안내가 다시 열릴 뿐이다.
  }
}

function getBrowserStorage(): EntryGuideStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
