import type { AppBadgeTone } from "@shared/ui/badge";

const SELECTION_YEAR_BADGE_TONE_MAP = {
  "2025": "info",
  "2026": "brand",
} satisfies Record<string, AppBadgeTone>;

export function getSelectionYearBadgeTone(year: number | string | undefined): AppBadgeTone {
  return SELECTION_YEAR_BADGE_TONE_MAP[String(year)] ?? "neutral";
}
