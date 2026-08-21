export const EXTERNAL_SEARCH_PROVIDERS = {
  NAVER: {
    id: "NAVER",
    label: "네이버",
    searchUrl: "https://search.naver.com/search.naver",
    queryParam: "query",
  },
  GOOGLE: {
    id: "GOOGLE",
    label: "구글",
    searchUrl: "https://www.google.com/search",
    queryParam: "q",
  },
  YOUTUBE: {
    id: "YOUTUBE",
    label: "유튜브",
    searchUrl: "https://www.youtube.com/results",
    queryParam: "search_query",
  },
} as const;

export const EXTERNAL_SEARCH_PROVIDER_IDS = ["NAVER", "GOOGLE", "YOUTUBE"] as const;

export type ExternalSearchProviderId = (typeof EXTERNAL_SEARCH_PROVIDER_IDS)[number];

export type ExternalSearchProvider = (typeof EXTERNAL_SEARCH_PROVIDERS)[ExternalSearchProviderId];
