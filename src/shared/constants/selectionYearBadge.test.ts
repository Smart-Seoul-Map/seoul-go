import { expect, test } from "vitest";
import { getSelectionYearBadgeTone } from "./selectionYearBadge";

test.each([
  [2025, "info"],
  ["2025", "info"],
  [2026, "brand"],
  ["2026", "brand"],
  [2027, "neutral"],
  [undefined, "neutral"],
  ["", "neutral"],
] as const)("maps selection year %s to %s", (year, tone) => {
  expect(getSelectionYearBadgeTone(year)).toBe(tone);
});
