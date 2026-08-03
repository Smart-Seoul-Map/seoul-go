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
  searchArea?: SmartSeoulThemeContentsSearchArea;
  themeIds?: readonly string[];
};

export type SmartSeoulThemeContentsSearchArea = {
  center: {
    lat: number;
    lng: number;
  };
  distanceMeters: number;
};

export type RequestSmartSeoulThemeJson = (url: URL) => Promise<SmartSeoulThemeContentsResponse>;

export type FetchSmartSeoulThemePlacesOptions = {
  apiKey: string;
  searchArea?: SmartSeoulThemeContentsSearchArea;
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
  searchArea,
  themeIds = SMART_SEOUL_PLACE_THEME_IDS,
}: BuildSmartSeoulThemeContentsUrlOptions): URL {
  const searchCenter = searchArea?.center ?? SMART_SEOUL_THEME_CONTENTS_SEARCH_CENTER;
  const searchDistanceMeters =
    searchArea?.distanceMeters ?? SMART_SEOUL_THEME_CONTENTS_SEARCH_DISTANCE_METERS;
  const url = new URL(
    `${API_BASE_URL.SMART_SEOUL}/${encodeURIComponent(
      apiKey
    )}${END_POINTS.smartSeoulThemeContents(SMART_SEOUL_THEME_CONTENTS_LANGUAGE)}`
  );

  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set("page_no", String(pageNo));
  url.searchParams.set("coord_x", String(searchCenter.lng));
  url.searchParams.set("coord_y", String(searchCenter.lat));
  url.searchParams.set("distance", String(searchDistanceMeters));
  url.searchParams.set("search_type", SMART_SEOUL_THEME_CONTENTS_SEARCH_TYPE);
  url.searchParams.set("search_name", SMART_SEOUL_THEME_CONTENTS_EMPTY_SEARCH_VALUE);
  url.searchParams.set("theme_id", themeIds.join(","));
  url.searchParams.set("content_id", SMART_SEOUL_THEME_CONTENTS_EMPTY_SEARCH_VALUE);
  url.searchParams.set("subcate_id", SMART_SEOUL_THEME_CONTENTS_EMPTY_SEARCH_VALUE);

  return url;
}

function readResultCode(response: SmartSeoulThemeContentsResponse): string | null {
  const header = response.header;
  const head = response.head;

  if (isRecord(header)) {
    return header.resultCode === undefined ? null : String(header.resultCode);
  }

  if (isRecord(head)) {
    return head.RETCODE === undefined ? null : String(head.RETCODE);
  }

  return null;
}

function readPageCount(response: SmartSeoulThemeContentsResponse): number {
  const header = response.header;
  const head = response.head;
  const pageCount = isRecord(header) ? header.PAGE_COUNT : isRecord(head) ? head.PAGE_COUNT : 1;
  const parsedPageCount = Number(pageCount);

  return Number.isFinite(parsedPageCount) && parsedPageCount > 0 ? parsedPageCount : 1;
}

function readTotalCount(response: SmartSeoulThemeContentsResponse): number {
  const header = response.header;
  const head = response.head;
  const totalCount = isRecord(header)
    ? header.TOTAL_COUNT
    : isRecord(head)
      ? head.TOTAL_COUNT
      : undefined;
  const parsedTotalCount = Number(totalCount);

  return Number.isFinite(parsedTotalCount) && parsedTotalCount >= 0 ? parsedTotalCount : -1;
}

function isEmptySearchResultResponse(
  response: SmartSeoulThemeContentsResponse,
  resultCode: string | null
): boolean {
  return resultCode === "100" && readTotalCount(response) === 0 && Array.isArray(response.body);
}

function isSuccessfulResponse(
  response: SmartSeoulThemeContentsResponse,
  resultCode: string | null
): boolean {
  return (
    resultCode !== null &&
    (SMART_SEOUL_THEME_CONTENTS_SUCCESS_CODES.has(resultCode) ||
      isEmptySearchResultResponse(response, resultCode))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

async function requestSmartSeoulThemeJson(url: URL): Promise<SmartSeoulThemeContentsResponse> {
  return kyClient.get(url).json<SmartSeoulThemeContentsResponse>();
}

export async function fetchSmartSeoulThemePlaces({
  apiKey,
  searchArea,
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
        searchArea,
        themeIds: [themeId],
      });
      const response = await requestJson(url);
      const resultCode = readResultCode(response);

      if (!isSuccessfulResponse(response, resultCode)) {
        throw new Error(
          `Smart Seoul theme ${themeId} contents returned ${resultCode ?? "unknown"}`
        );
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

  return normalizeSmartSeoulThemeContentsResponse({ body: rows });
}
