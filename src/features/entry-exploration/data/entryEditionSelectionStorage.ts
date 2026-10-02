const STORAGE_KEY = "seoul-go:entry-edition-selection:v1";

export function loadPreviousEntryEditionIds(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!Array.isArray(value)) return [];

    return value.filter((id): id is string => typeof id === "string").slice(0, 10);
  } catch {
    return [];
  }
}

export function savePreviousEntryEditionIds(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Selection still works for this visit when browser storage is unavailable.
  }
}
