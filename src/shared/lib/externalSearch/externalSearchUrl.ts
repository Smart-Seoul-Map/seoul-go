import {
  EXTERNAL_SEARCH_PROVIDER_IDS,
  EXTERNAL_SEARCH_PROVIDERS,
  EXTERNAL_SEARCH_QUERY_PLACEHOLDER,
} from "@shared/constants/externalSearch";
import type {
  ExternalSearchProvider,
  ExternalSearchProviderId,
} from "@shared/constants/externalSearch";

const SECURE_NEW_TAB_WINDOW_FEATURES = "noopener,noreferrer";

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

  return getExternalSearchProvider(providerId).searchUrlTemplate.replace(
    EXTERNAL_SEARCH_QUERY_PLACEHOLDER,
    encodeURIComponent(keyword)
  );
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

export function openExternalSearch(providerId: ExternalSearchProviderId, query: string): boolean {
  const url = buildExternalSearchUrl(providerId, query);

  if (!url) {
    return false;
  }

  window.open(url, "_blank", SECURE_NEW_TAB_WINDOW_FEATURES);

  return true;
}
