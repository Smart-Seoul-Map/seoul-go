const SMART_SEOUL_TMS_TILE_BASE_URL = "https://map.seoul.go.kr/tms";
const SMART_SEOUL_TMS_KOREAN_MAP_ID = "dawul_kor_normal_3857_20260223";
const SMART_SEOUL_TILE_CACHE_CONTROL = "public, max-age=86400";
const SMART_SEOUL_TILE_FALLBACK_CONTENT_TYPE = "image/png";
const SMART_SEOUL_TILE_ACCEPT_HEADER =
  "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const SMART_SEOUL_TILE_PROXY_HEADER_NAME = "X-Smart-Seoul-Map-Proxy";
const SMART_SEOUL_TILE_PROXY_HEADER_VALUE = "hit";
const SMART_SEOUL_TMS_TILE_PATH_PATTERN =
  /^\/api\/smart-seoul-map\/tms\/dawul_kor_normal_3857_20260223\/\d+\/\d+\/\d+\.png$/;

function createTextResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      [SMART_SEOUL_TILE_PROXY_HEADER_NAME]: SMART_SEOUL_TILE_PROXY_HEADER_VALUE,
    },
  });
}

function buildSmartSeoulTmsTileUrl(pathname: string): string | null {
  if (!SMART_SEOUL_TMS_TILE_PATH_PATTERN.test(pathname)) {
    return null;
  }

  const smartSeoulPath = pathname.replace(
    `/api/smart-seoul-map/tms/${SMART_SEOUL_TMS_KOREAN_MAP_ID}`,
    SMART_SEOUL_TMS_KOREAN_MAP_ID
  );

  return `${SMART_SEOUL_TMS_TILE_BASE_URL}/${smartSeoulPath}`;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const { pathname } = new URL(request.url);
  const tmsTileUrl = buildSmartSeoulTmsTileUrl(pathname);

  if (tmsTileUrl) {
    return proxySmartSeoulTile(tmsTileUrl);
  }

  return createTextResponse("Invalid Smart Seoul TMS tile path.", 400);
};

async function proxySmartSeoulTile(tileUrl: string): Promise<Response> {
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
}
