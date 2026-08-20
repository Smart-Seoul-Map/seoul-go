export const EXTERNAL_SEARCH_PROVIDERS = {
  NAVER: {
    id: "NAVER",
    label: "네이버",
    searchUrlTemplate: "https://search.naver.com/search.naver?query={query}",
  },
  GOOGLE: {
    id: "GOOGLE",
    label: "구글",
    searchUrlTemplate: "https://www.google.com/search?q={query}",
  },
  YOUTUBE: {
    id: "YOUTUBE",
    label: "유튜브",
    searchUrlTemplate: "https://www.youtube.com/results?search_query={query}",
  },
} as const;

export const EXTERNAL_SEARCH_PROVIDER_IDS = ["NAVER", "GOOGLE", "YOUTUBE"] as const;

export const EXTERNAL_SEARCH_QUERY_PLACEHOLDER = "{query}";

export type ExternalSearchProviderId = (typeof EXTERNAL_SEARCH_PROVIDER_IDS)[number];

export type ExternalSearchProvider = (typeof EXTERNAL_SEARCH_PROVIDERS)[ExternalSearchProviderId];
