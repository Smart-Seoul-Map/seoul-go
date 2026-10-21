import { ENTRY_EDITION_MODELS } from "../config/entryEditionModels";
import type { EntryEditionPlace } from "../domain/entryEditionPlace";

export const ENTRY_TEST_PLACES: readonly EntryEditionPlace[] = [
  {
    id: "smart-seoul:1786321258890:25_edition25_21",
    name: "해방촌신흥시장",
    description: "시장 소개",
    imageUrl: "/test-market.png",
    address: "서울특별시 용산구 신흥로 95-9",
    selectionYear: 2025,
    position: { lat: 37.54532375, lng: 126.985085516 },
  },
  {
    id: "smart-seoul:1786321258890:26_edition25_21",
    name: "리움미술관",
    description: "미술관 소개",
    imageUrl: "/test-museum.png",
    address: "서울특별시 용산구 이태원로55길 60-16",
    selectionYear: 2026,
    position: { lat: 37.538461285, lng: 126.999294107 },
  },
];

export const ENTRY_MODELED_TEST_PLACES: readonly EntryEditionPlace[] = Object.keys(
  ENTRY_EDITION_MODELS
).map((id, index) => ({
  ...ENTRY_TEST_PLACES[index % ENTRY_TEST_PLACES.length],
  id,
  name: `모델 장소 ${index + 1}`,
}));
