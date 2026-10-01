const PLACE_IMAGE_ALLOWED_HOSTS = new Set([
  "map.seoul.go.kr",
  "futureheritage.seoul.go.kr",
  "culture.seoul.go.kr",
  "mediahub.seoul.go.kr",
  "news.seoul.go.kr",
  "img.daum-kg.net",
]);
const PLACE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PLACE_IMAGE_TIMEOUT_MS = 10000;
const PLACE_IMAGE_MAX_REDIRECTS = 3;
const PLACE_IMAGE_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const PLACE_IMAGE_PROXY_HEADER = "X-Smart-Seoul-Place-Image-Proxy";

type PlaceImageEnv = {
  fetchPlaceImage?: typeof fetch;
};

function createTextResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      "Cache-Control": "no-store",
      [PLACE_IMAGE_PROXY_HEADER]: "hit",
    },
  });
}

function resolveAllowedPlaceImageUrl(rawUrl: string | null): URL | null {
  try {
    const url = new URL(rawUrl ?? "");
    if (!PLACE_IMAGE_ALLOWED_HOSTS.has(url.hostname) || url.username || url.password || url.port) {
      return null;
    }
    // The heritage API still returns HTTP URLs; the same image endpoint supports HTTPS.
    if (url.protocol === "http:" && url.hostname === "futureheritage.seoul.go.kr") {
      url.protocol = "https:";
    }

    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

async function fetchImageWithRedirects(
  imageUrl: URL,
  fetchImage: typeof fetch,
  signal: AbortSignal
): Promise<Response> {
  let url = imageUrl;
  for (let count = 0; count <= PLACE_IMAGE_MAX_REDIRECTS; count += 1) {
    const response = await fetchImage(url.href, {
      redirect: "manual",
      signal,
      headers: { Accept: "image/png,image/jpeg,image/webp,image/gif" },
    });
    if (!PLACE_IMAGE_REDIRECT_STATUSES.has(response.status)) return response;
    const location = response.headers.get("Location");
    await response.body?.cancel();
    const nextUrl = location && resolveAllowedPlaceImageUrl(new URL(location, url).href);
    if (!nextUrl) throw new Error("Invalid image redirect.");
    url = nextUrl;
  }

  throw new Error("Too many image redirects.");
}

async function readImageBytes(response: Response, signal: AbortSignal): Promise<Uint8Array> {
  const declaredSize = Number(response.headers.get("Content-Length"));
  if (!response.body || declaredSize > PLACE_IMAGE_MAX_BYTES) {
    await response.body?.cancel();
    throw new Error("Image response is empty or too large.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", abort, { once: true });

  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > PLACE_IMAGE_MAX_BYTES) {
        await reader.cancel();
        throw new Error("Image response is too large.");
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

function detectImageContentType(bytes: Uint8Array): string | null {
  const startsWith = (signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);
  if (startsWith([137, 80, 78, 71, 13, 10, 26, 10])) return "image/png";
  if (startsWith([255, 216, 255])) return "image/jpeg";
  const header = new TextDecoder().decode(bytes.subarray(0, 12));
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return "image/gif";
  if (header.startsWith("RIFF") && header.slice(8) === "WEBP") return "image/webp";

  return null;
}

async function proxyPlaceImage(imageUrl: URL, fetchImage: typeof fetch): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLACE_IMAGE_TIMEOUT_MS);

  try {
    const response = await fetchImageWithRedirects(imageUrl, fetchImage, controller.signal);
    if (!response.ok) {
      await response.body?.cancel();
      return createTextResponse("Place image request failed.", 502);
    }
    const bytes = await readImageBytes(response, controller.signal);
    const detectedType = detectImageContentType(bytes);
    const declaredType = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
    const isCompatibleType =
      !declaredType || declaredType === "application/octet-stream" || declaredType === detectedType;
    if (!detectedType || !isCompatibleType) {
      return createTextResponse("Place image response is not a supported image.", 502);
    }

    return new Response(bytes, {
      headers: {
        "Content-Type": detectedType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        [PLACE_IMAGE_PROXY_HEADER]: "hit",
      },
    });
  } catch {
    return createTextResponse(
      controller.signal.aborted ? "Place image request timed out." : "Place image request failed.",
      controller.signal.aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const onRequestGet: PagesFunction<PlaceImageEnv> = async ({ env, request }) => {
  const imageUrl = resolveAllowedPlaceImageUrl(new URL(request.url).searchParams.get("url"));

  if (!imageUrl) {
    return createTextResponse("Invalid place image url.", 400);
  }

  return proxyPlaceImage(imageUrl, env.fetchPlaceImage ?? fetch);
};
