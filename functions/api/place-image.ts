const PLACE_IMAGE_URL_PARAM = "url";
const PLACE_IMAGE_ROOT_HOST = "seoul.go.kr";
const PLACE_IMAGE_HOST_SUFFIX = ".seoul.go.kr";
const PLACE_IMAGE_ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const PLACE_IMAGE_CACHE_CONTROL = "public, max-age=86400";
const PLACE_IMAGE_FALLBACK_CONTENT_TYPE = "image/jpeg";
const PLACE_IMAGE_ACCEPT_HEADER =
  "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const PLACE_IMAGE_PROXY_HEADER_NAME = "X-Smart-Seoul-Place-Image-Proxy";
const PLACE_IMAGE_PROXY_HEADER_VALUE = "hit";

type PlaceImageEnv = {
  fetchPlaceImage?: typeof fetch;
};

function createTextResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      [PLACE_IMAGE_PROXY_HEADER_NAME]: PLACE_IMAGE_PROXY_HEADER_VALUE,
    },
  });
}

function resolveAllowedPlaceImageUrl(rawUrl: string | null): URL | null {
  if (!rawUrl) {
    return null;
  }

  let imageUrl: URL;

  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!PLACE_IMAGE_ALLOWED_PROTOCOLS.has(imageUrl.protocol)) {
    return null;
  }

  const hostname = imageUrl.hostname.toLowerCase();
  const isAllowedHost =
    hostname === PLACE_IMAGE_ROOT_HOST || hostname.endsWith(PLACE_IMAGE_HOST_SUFFIX);

  return isAllowedHost ? imageUrl : null;
}

async function proxyPlaceImage(imageUrl: URL, fetchImage: typeof fetch): Promise<Response> {
  const imageResponse = await fetchImage(imageUrl.href, {
    headers: {
      Accept: PLACE_IMAGE_ACCEPT_HEADER,
    },
  });

  if (!imageResponse.ok) {
    return createTextResponse(`Place image request failed: ${imageResponse.status}`, 502);
  }

  const contentType =
    imageResponse.headers.get("Content-Type") || PLACE_IMAGE_FALLBACK_CONTENT_TYPE;

  if (!contentType.toLowerCase().startsWith("image/")) {
    return createTextResponse("Place image response is not an image.", 502);
  }

  const responseHeaders = new Headers(imageResponse.headers);
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Cache-Control", PLACE_IMAGE_CACHE_CONTROL);
  responseHeaders.set("Content-Type", contentType);
  responseHeaders.set(PLACE_IMAGE_PROXY_HEADER_NAME, PLACE_IMAGE_PROXY_HEADER_VALUE);
  responseHeaders.delete("Set-Cookie");

  return new Response(imageResponse.body, {
    status: imageResponse.status,
    headers: responseHeaders,
  });
}

export const onRequestGet: PagesFunction<PlaceImageEnv> = async ({ env, request }) => {
  const { searchParams } = new URL(request.url);
  const imageUrl = resolveAllowedPlaceImageUrl(searchParams.get(PLACE_IMAGE_URL_PARAM));

  if (!imageUrl) {
    return createTextResponse("Invalid place image url.", 400);
  }

  return proxyPlaceImage(imageUrl, env.fetchPlaceImage ?? fetch);
};
