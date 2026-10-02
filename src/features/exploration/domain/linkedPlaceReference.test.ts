import { describe, expect, test } from "vitest";
import { resolveLinkedPlaceReference } from "./linkedPlaceReference";

const edition = "1786321258890";
const makePlace = (id: string, addedAt: string, themeId = edition) => ({
  id,
  addedAt,
  themeId,
  name: id,
  position: { lat: 37.54, lng: 126.98 },
});

describe("linked place reference", () => {
  test("does not activate recommendations merely because saved places exist", () => {
    expect(resolveLinkedPlaceReference([makePlace("a", "2026-01-01")], null)).toBeNull();
  });
  test("keeps explicit selection and falls back by addition time, not course order", () => {
    const refs = [makePlace("new", "2026-01-03"), makePlace("old", "2026-01-01")];
    expect(resolveLinkedPlaceReference(refs, "old")?.id).toBe("old");
    expect(resolveLinkedPlaceReference(refs, "removed")?.id).toBe("new");
    expect(resolveLinkedPlaceReference([], "removed")).toBeNull();
  });
});
