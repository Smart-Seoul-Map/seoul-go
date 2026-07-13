type SmartSeoulMapTileEnv = {
  SMART_SEOUL_MAP_KEY?: string;
  VITE_SMART_SEOUL_MAP_KEY?: string;
};

const SMART_SEOUL_TILE_BASE_URL = "https://map.seoul.go.kr/openapi/v5";
const SMART_SEOUL_TILE_CACHE_CONTROL = "public, max-age=86400";
const SMART_SEOUL_TILE_FALLBACK_CONTENT_TYPE = "image/png";
const SMART_SEOUL_TILE_ACCEPT_HEADER =
  "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const SMART_SEOUL_TILE_PROXY_HEADER_NAME = "X-Smart-Seoul-Map-Proxy";
const SMART_SEOUL_TILE_PROXY_HEADER_VALUE = "hit";
const SMART_SEOUL_TILE_PATH_PATTERN =
  /^\/api\/smart-seoul-map\/public\/map\/base\/dawul_kor_normal\/\d+\/\d+\/\d+\/\d+\/\d+\/png$/;

function readSmartSeoulMapKey(env: SmartSeoulMapTileEnv): string {
  return env.SMART_SEOUL_MAP_KEY ?? env.VITE_SMART_SEOUL_MAP_KEY ?? "";
}

function createTextResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      [SMART_SEOUL_TILE_PROXY_HEADER_NAME]: SMART_SEOUL_TILE_PROXY_HEADER_VALUE,
    },
  });
}

function buildSmartSeoulTileUrl(request: Request, apiKey: string): string | null {
  const url = new URL(request.url);

  if (!SMART_SEOUL_TILE_PATH_PATTERN.test(url.pathname)) {
    return null;
  }

  const smartSeoulPath = url.pathname.replace("/api/smart-seoul-map", "");

  return `${SMART_SEOUL_TILE_BASE_URL}/${encodeURIComponent(apiKey)}${smartSeoulPath}`;
}

export const onRequestGet: PagesFunction<SmartSeoulMapTileEnv> = async ({ request, env }) => {
  const apiKey = readSmartSeoulMapKey(env);

  if (!apiKey) {
    return createTextResponse("Smart Seoul map key is not configured.", 500);
  }

  const tileUrl = buildSmartSeoulTileUrl(request, apiKey);

  if (!tileUrl) {
    return createTextResponse("Invalid Smart Seoul tile path.", 400);
  }

  const tileResponse = await fetch(tileUrl, {
    headers: {
      Accept: SMART_SEOUL_TILE_ACCEPT_HEADER,
    },
  });

  if (!tileResponse.ok) {
    return createTextResponse(`Smart Seoul tile request failed: ${tileResponse.status}`, 502);
  }

  const contentType =
    tileResponse.headers.get("Content-Type") ?? SMART_SEOUL_TILE_FALLBACK_CONTENT_TYPE;

  if (!contentType.toLowerCase().startsWith("image/")) {
    return createTextResponse("Smart Seoul tile response is not an image.", 502);
  }

  const responseHeaders = new Headers(tileResponse.headers);
  responseHeaders.set("Cache-Control", SMART_SEOUL_TILE_CACHE_CONTROL);
  responseHeaders.set("Content-Type", contentType);
  responseHeaders.set(SMART_SEOUL_TILE_PROXY_HEADER_NAME, SMART_SEOUL_TILE_PROXY_HEADER_VALUE);
  responseHeaders.delete("Set-Cookie");

  return new Response(tileResponse.body, {
    status: tileResponse.status,
    headers: responseHeaders,
  });
};
