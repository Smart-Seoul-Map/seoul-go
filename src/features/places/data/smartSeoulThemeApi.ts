import { API_BASE_URL, END_POINTS } from "@shared/constants/api";
import { kyClient } from "@shared/lib/http/kyClient";

import { SMART_SEOUL_PLACE_THEME_IDS } from "../config/placeThemeConfig";
import {
  SMART_SEOUL_THEME_CONTENTS_LANGUAGE,
  SMART_SEOUL_THEME_CONTENTS_DEFAULT_MAX_PAGES,
  SMART_SEOUL_THEME_CONTENTS_EMPTY_SEARCH_VALUE,
  SMART_SEOUL_THEME_CONTENTS_PAGE_SIZE,
  SMART_SEOUL_THEME_CONTENTS_SEARCH_CENTER,
  SMART_SEOUL_THEME_CONTENTS_SEARCH_DISTANCE_METERS,
  SMART_SEOUL_THEME_CONTENTS_SEARCH_TYPE,
  SMART_SEOUL_THEME_CONTENTS_SUCCESS_CODES,
} from "../config/smartSeoulThemeApiConfig";
import {
  normalizeSmartSeoulThemeContentsResponse,
  type SmartSeoulThemeContentsResponse,
} from "../domain/placeNormalizer";
import type { SmartSeoulThemePlace } from "../domain/place";

export type BuildSmartSeoulThemeContentsUrlOptions = {
  apiKey: string;
  pageNo?: number;
  pageSize?: number;
  themeIds?: readonly string[];
};

export type RequestSmartSeoulThemeJson = (url: URL) => Promise<SmartSeoulThemeContentsResponse>;

export type FetchSmartSeoulThemePlacesOptions = {
  apiKey: string;
  districtName?: string;
  themeIds?: readonly string[];
  requestJson?: RequestSmartSeoulThemeJson;
  maxPages?: number;
};

export function getSmartSeoulThemeApiKey(): string {
  return import.meta.env.VITE_SMART_SEOUL_THEME_KEY ?? "";
}

export function buildSmartSeoulThemeContentsUrl({
  apiKey,
  pageNo = 1,
  pageSize = SMART_SEOUL_THEME_CONTENTS_PAGE_SIZE,
  themeIds = SMART_SEOUL_PLACE_THEME_IDS,
}: BuildSmartSeoulThemeContentsUrlOptions): URL {
  const url = new URL(
    `${API_BASE_URL.SMART_SEOUL}/${encodeURIComponent(
      apiKey
    )}${END_POINTS.smartSeoulThemeContents(SMART_SEOUL_THEME_CONTENTS_LANGUAGE)}`
  );

  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set("page_no", String(pageNo));
  url.searchParams.set("coord_x", String(SMART_SEOUL_THEME_CONTENTS_SEARCH_CENTER.lng));
  url.searchParams.set("coord_y", String(SMART_SEOUL_THEME_CONTENTS_SEARCH_CENTER.lat));
  url.searchParams.set("distance", String(SMART_SEOUL_THEME_CONTENTS_SEARCH_DISTANCE_METERS));
  url.searchParams.set("search_type", SMART_SEOUL_THEME_CONTENTS_SEARCH_TYPE);
  url.searchParams.set("search_name", SMART_SEOUL_THEME_CONTENTS_EMPTY_SEARCH_VALUE);
  url.searchParams.set("theme_id", themeIds.join(","));
  url.searchParams.set("content_id", SMART_SEOUL_THEME_CONTENTS_EMPTY_SEARCH_VALUE);
  url.searchParams.set("subcate_id", SMART_SEOUL_THEME_CONTENTS_EMPTY_SEARCH_VALUE);

  return url;
}

function readResultCode(response: SmartSeoulThemeContentsResponse): string {
  const header = response.header;
  const head = response.head;

  if (isRecord(header)) {
    return String(header.resultCode ?? "");
  }

  if (isRecord(head)) {
    return String(head.RETCODE ?? "");
  }

  return "";
}

function readPageCount(response: SmartSeoulThemeContentsResponse): number {
  const header = response.header;
  const head = response.head;
  const pageCount = isRecord(header) ? header.PAGE_COUNT : isRecord(head) ? head.PAGE_COUNT : 1;
  const parsedPageCount = Number(pageCount);

  return Number.isFinite(parsedPageCount) && parsedPageCount > 0 ? parsedPageCount : 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function hasDistrictName(row: unknown, districtName: string): boolean {
  if (!isRecord(row)) {
    return false;
  }

  const rowDistrictName = row.COT_GU_NAME;

  return typeof rowDistrictName === "string" && rowDistrictName.trim() === districtName;
}

async function requestSmartSeoulThemeJson(url: URL): Promise<SmartSeoulThemeContentsResponse> {
  return kyClient.get(url).json<SmartSeoulThemeContentsResponse>();
}

export async function fetchSmartSeoulThemePlaces({
  apiKey,
  districtName,
  themeIds = SMART_SEOUL_PLACE_THEME_IDS,
  requestJson = requestSmartSeoulThemeJson,
  maxPages = SMART_SEOUL_THEME_CONTENTS_DEFAULT_MAX_PAGES,
}: FetchSmartSeoulThemePlacesOptions): Promise<SmartSeoulThemePlace[]> {
  const rows: unknown[] = [];

  for (const themeId of themeIds) {
    let pageNo = 1;

    while (pageNo <= maxPages) {
      const url = buildSmartSeoulThemeContentsUrl({
        apiKey,
        pageNo,
        themeIds: [themeId],
      });
      const response = await requestJson(url);
      const resultCode = readResultCode(response);

      if (!SMART_SEOUL_THEME_CONTENTS_SUCCESS_CODES.has(resultCode)) {
        throw new Error(`Smart Seoul theme ${themeId} contents returned ${resultCode}`);
      }

      if (Array.isArray(response.body)) {
        rows.push(...response.body);
      }

      if (pageNo >= readPageCount(response)) {
        break;
      }

      pageNo += 1;
    }
  }

  const districtRows = districtName
    ? rows.filter((row) => hasDistrictName(row, districtName))
    : rows;

  return normalizeSmartSeoulThemeContentsResponse({ body: districtRows });
}
