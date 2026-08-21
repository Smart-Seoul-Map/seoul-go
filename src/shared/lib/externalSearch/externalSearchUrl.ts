import {
  EXTERNAL_SEARCH_PROVIDER_IDS,
  EXTERNAL_SEARCH_PROVIDERS,
} from "@shared/constants/externalSearch";
import type {
  ExternalSearchProvider,
  ExternalSearchProviderId,
} from "@shared/constants/externalSearch";

const NEW_TAB_TARGET = "_blank";

export type ExternalSearchLink = {
  providerId: ExternalSearchProviderId;
  label: string;
  url: string;
};

export function getExternalSearchProvider(
  providerId: ExternalSearchProviderId
): ExternalSearchProvider {
  return EXTERNAL_SEARCH_PROVIDERS[providerId];
}

export function buildExternalSearchUrl(
  providerId: ExternalSearchProviderId,
  query: string
): string {
  const keyword = query.trim();

  if (!keyword) {
    return "";
  }

  const { searchUrl, queryParam } = getExternalSearchProvider(providerId);
  const url = new URL(searchUrl);

  url.searchParams.set(queryParam, keyword);

  return url.toString();
}

export function createExternalSearchLinks(
  query: string,
  providerIds: readonly ExternalSearchProviderId[] = EXTERNAL_SEARCH_PROVIDER_IDS
): ExternalSearchLink[] {
  return providerIds
    .map((providerId) => ({
      providerId,
      label: getExternalSearchProvider(providerId).label,
      url: buildExternalSearchUrl(providerId, query),
    }))
    .filter((link) => link.url !== "");
}

export function openExternalSearch(providerId: ExternalSearchProviderId, query: string): void {
  const url = buildExternalSearchUrl(providerId, query);

  if (!url) {
    return;
  }

  const openedWindow = window.open(url, NEW_TAB_TARGET);

  if (openedWindow) {
    openedWindow.opener = null;
  }
}
