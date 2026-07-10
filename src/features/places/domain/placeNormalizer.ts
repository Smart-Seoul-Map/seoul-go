import { getSmartSeoulPlaceTheme } from "../config/placeThemeConfig";
import type { SmartSeoulThemePlace } from "./place";

type RawSmartSeoulThemeContent = Record<string, unknown>;

export type SmartSeoulThemeContentsResponse = {
  header?: Record<string, unknown>;
  head?: Record<string, unknown>;
  body?: unknown;
};

function cleanText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function field(source: RawSmartSeoulThemeContent, keys: string[]): string {
  for (const key of keys) {
    const value = cleanText(source[key]);

    if (value && value.toLowerCase() !== "null") {
      return value;
    }
  }

  return "";
}

function finiteNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function normalizeSmartSeoulThemeContent(raw: unknown): SmartSeoulThemePlace | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as RawSmartSeoulThemeContent;
  const themeId = field(source, ["COT_THEME_ID", "THEME_ID"]);
  const theme = getSmartSeoulPlaceTheme(themeId);

  if (!theme) {
    return null;
  }

  const sourceContentId = field(source, ["COT_CONTS_ID", "CCONTENTS_ID", "CONTENTS_ID"]);
  const name = field(source, ["COT_CONTS_NAME", "CONTENTS_NAME"]);
  const lng = finiteNumber(field(source, ["COT_COORD_X", "COORD_X"]));
  const lat = finiteNumber(field(source, ["COT_COORD_Y", "COORD_Y"]));

  if (!sourceContentId || !name || lng === undefined || lat === undefined) {
    return null;
  }

  return {
    id: `smart-seoul:${themeId}:${sourceContentId}`,
    sourceContentId,
    name,
    themeId,
    themeName: theme.name,
    address: field(source, ["COT_ADDR_FULL_NEW", "ADDR_NEW", "COT_ADDR_FULL_OLD", "ADDR_OLD"]),
    position: {
      lng,
      lat,
    },
  };
}

export function normalizeSmartSeoulThemeContentsResponse(
  response: SmartSeoulThemeContentsResponse
): SmartSeoulThemePlace[] {
  const rows = Array.isArray(response.body) ? response.body : [];

  return rows
    .map((row) => normalizeSmartSeoulThemeContent(row))
    .filter((place): place is SmartSeoulThemePlace => place !== null);
}
