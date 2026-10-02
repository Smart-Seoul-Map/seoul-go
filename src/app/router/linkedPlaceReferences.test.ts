import { expect, test } from "vitest";
import { createLinkedPlaceReferences } from "./linkedPlaceReferences";

test("keeps same-year reference places distinct and excludes non-Edition places", () => {
  const makePlace = (id: string, themeId = "1786321258890") => ({
    id,
    themeId,
    name: id,
    position: { lat: 37, lng: 127 },
    addedAt: "2026-01-01",
  });
  const saved = [
    makePlace("smart-seoul:1786321258890:25_edition25_1"),
    makePlace("smart-seoul:1786321258890:25_edition25_2"),
    makePlace("other", "100032"),
  ];
  const refs = createLinkedPlaceReferences(saved, []);
  expect(refs).toHaveLength(2);
  expect(refs.map((place) => place.selectionYear)).toEqual([2025, 2025]);
  expect(saved).toHaveLength(3);
});
