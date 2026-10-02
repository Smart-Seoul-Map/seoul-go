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
  SMART_SEOUL_THEME_REQUEST_CONCURRENCY,
} from "../config/smartSeoulThemeApiConfig";
import {
  normalizeSmartSeoulThemeContentsResponse,
  normalizeSmartSeoulThemeContent,
  type SmartSeoulThemeContentsResponse,
} from "../domain/placeNormalizer";
import type { SmartSeoulThemePlace } from "../domain/place";
import { sortNearbyPlaces, type NearbySmartSeoulPlace } from "../domain/nearbyPlace";
import { withSmartSeoulRequestSlot } from "./smartSeoulRequestScheduler";

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

export type RequestSmartSeoulThemeJson = (
  url: URL,
  options?: { signal?: AbortSignal }
) => Promise<SmartSeoulThemeContentsResponse>;

export type FetchSmartSeoulThemePlacesOptions = {
  apiKey: string;
  searchArea?: SmartSeoulThemeContentsSearchArea;
  themeIds?: readonly string[];
  requestJson?: RequestSmartSeoulThemeJson;
  maxPages?: number;
  signal?: AbortSignal;
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
  const code = response.header?.resultCode ?? response.head?.RETCODE;
  return code === undefined || code === null ? null : String(code);
}

function readCount(response: SmartSeoulThemeContentsResponse, key: string): number | null {
  const value = response.header?.[key] ?? response.head?.[key];
  if (value === undefined || value === null || value === "") return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

function readPageCount(response: SmartSeoulThemeContentsResponse): number | null {
  const count = readCount(response, "PAGE_COUNT");
  if (count !== null) return Math.max(1, count);
  const total = readCount(response, "TOTAL_COUNT");
  const size = readCount(response, "PAGE_SIZE");
  if (total !== null && size && size > 0) return Math.max(1, Math.ceil(total / size));
  return null;
}

function isEmptySearchResultResponse(
  response: SmartSeoulThemeContentsResponse,
  resultCode: string | null
): boolean {
  return (
    resultCode === "100" &&
    readCount(response, "TOTAL_COUNT") === 0 &&
    Array.isArray(response.body) &&
    response.body.length === 0
  );
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
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestSmartSeoulThemeJson(
  url: URL,
  options?: { signal?: AbortSignal }
): Promise<SmartSeoulThemeContentsResponse> {
  return kyClient
    .get(url, { signal: options?.signal, retry: 2 })
    .json<SmartSeoulThemeContentsResponse>();
}

async function getSmartSeoulThemeRows(
  options: FetchSmartSeoulThemePlacesOptions
): Promise<unknown[]> {
  const themeIds = [...new Set(options.themeIds ?? SMART_SEOUL_PLACE_THEME_IDS)];
  if (themeIds.length === 0) return [];
  if (themeIds.length === 1) return getThemeRows({ ...options, themeId: themeIds[0] });
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  options.signal?.throwIfAborted();
  options.signal?.addEventListener("abort", abort, { once: true });
  const results: unknown[][] = new Array(themeIds.length);
  let nextIndex = 0;
  const work = async () => {
    while (nextIndex < themeIds.length) {
      controller.signal.throwIfAborted();
      const index = nextIndex++;
      results[index] = await getThemeRows({
        ...options,
        themeId: themeIds[index],
        signal: controller.signal,
      });
    }
  };
  try {
    await Promise.all(
      Array.from({ length: Math.min(SMART_SEOUL_THEME_REQUEST_CONCURRENCY, themeIds.length) }, work)
    );
    return results.flat();
  } catch (error) {
    controller.abort();
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", abort);
  }
}

async function getThemeRows({
  apiKey,
  searchArea,
  themeId,
  requestJson = requestSmartSeoulThemeJson,
  maxPages = SMART_SEOUL_THEME_CONTENTS_DEFAULT_MAX_PAGES,
  signal,
}: FetchSmartSeoulThemePlacesOptions & { themeId: string }): Promise<unknown[]> {
  if (!Number.isInteger(maxPages) || maxPages < 1) throw new Error("Invalid page limit");
  const rows: unknown[] = [];

  let pageNo = 1;
  let themeRowCount = 0;
  let expectedPageCount: number | null = null;
  let expectedTotal: number | null = null;

  while (pageNo <= maxPages) {
    signal?.throwIfAborted();
    const url = buildSmartSeoulThemeContentsUrl({
      apiKey,
      pageNo,
      searchArea,
      themeIds: [themeId],
    });
    const response = await withSmartSeoulRequestSlot(() => requestJson(url, { signal }), signal);
    signal?.throwIfAborted();
    const resultCode = readResultCode(response);

    if (!isSuccessfulResponse(response, resultCode)) {
      throw new Error(`Smart Seoul theme ${themeId} contents returned ${resultCode ?? "unknown"}`);
    }

    if (!Array.isArray(response.body)) throw new Error("Smart Seoul contents body is invalid");
    if (pageNo > 1 && response.body.length === 0)
      throw new Error("Smart Seoul contents pagination is incomplete");
    rows.push(...response.body);
    themeRowCount += response.body.length;
    const reportedPageCount = readPageCount(response);
    const reportedTotal = readCount(response, "TOTAL_COUNT");
    if (
      (expectedPageCount !== null &&
        reportedPageCount !== null &&
        expectedPageCount !== reportedPageCount) ||
      (expectedTotal !== null && reportedTotal !== null && expectedTotal !== reportedTotal)
    )
      throw new Error("Smart Seoul contents pagination is incomplete");
    expectedPageCount = reportedPageCount ?? expectedPageCount;
    expectedTotal = reportedTotal ?? expectedTotal;
    // Missing later metadata must not erase an earlier completeness guarantee.
    if (expectedPageCount === null && response.body.length >= SMART_SEOUL_THEME_CONTENTS_PAGE_SIZE)
      throw new Error("Smart Seoul contents pagination is incomplete");
    const pageCount = expectedPageCount ?? pageNo;
    const returnedPage = readCount(response, "PAGE_NO");
    if (
      returnedPage !== null &&
      returnedPage !== pageNo &&
      !isEmptySearchResultResponse(response, resultCode)
    )
      throw new Error("Smart Seoul contents page is incomplete");

    if (pageNo >= pageCount) {
      if (expectedTotal !== null && themeRowCount !== expectedTotal)
        throw new Error("Smart Seoul contents result is incomplete");
      break;
    }
    if (pageNo === maxPages || response.body.length === 0)
      throw new Error("Smart Seoul contents pagination is incomplete");
    pageNo += 1;
  }
  return rows;
}

export async function fetchSmartSeoulThemePlaces(
  options: FetchSmartSeoulThemePlacesOptions
): Promise<SmartSeoulThemePlace[]> {
  const rows = await getSmartSeoulThemeRows(options);
  return normalizeSmartSeoulThemeContentsResponse({ body: rows });
}

export async function getNearbySmartSeoulPlaces(
  options: FetchSmartSeoulThemePlacesOptions & { searchArea: SmartSeoulThemeContentsSearchArea }
): Promise<NearbySmartSeoulPlace[]> {
  const rows = await getSmartSeoulThemeRows(options);
  const results: NearbySmartSeoulPlace[] = [];
  for (const row of rows) {
    const place = normalizeSmartSeoulThemeContent(row);
    if (!place || !isRecord(row)) continue;
    const rawDistance = row.DIST;
    const distance =
      typeof rawDistance === "number" ||
      (typeof rawDistance === "string" && rawDistance.trim() !== "")
        ? Number(rawDistance)
        : NaN;
    results.push({ place, distance: Number.isFinite(distance) && distance >= 0 ? distance : null });
  }
  return sortNearbyPlaces(results);
}
