export const ENTRY_GUIDE_SEEN_STORAGE_KEY = "seoul-go:entry-guide-seen:v1";
export type EntryGuideStorage = Pick<Storage, "getItem" | "setItem">;

// 첫 진입 번호 안내는 브라우저마다 한 번만 자동으로 연다. 저장소를 못 쓰면 매번 열어도 동작에는 문제없다.
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
