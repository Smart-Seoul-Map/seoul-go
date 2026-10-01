// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";

import { onRequestGet } from "../functions/api/place-image";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const photo = "https://img.daum-kg.net/2026seouledition25/data/photo.png";
const mapPhoto = "https://map.seoul.go.kr/smgis2/file/ucimgs/conts/photo.jpg";

function request(url: string, fetchImage = vi.fn<typeof fetch>()) {
  return onRequestGet({
    request: new Request(`https://app.example/api/place-image?url=${encodeURIComponent(url)}`),
    env: { fetchPlaceImage: fetchImage },
  } as Parameters<typeof onRequestGet>[0]);
}

afterEach(() => vi.useRealTimers());

test("allows the edition photo host and verifies bytes when the upstream omits its type", async () => {
  const fetchImage = vi.fn<typeof fetch>().mockResolvedValue(new Response(png));
  const response = await request(photo, fetchImage);
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("image/png");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(png);
});

test.each([
  "https://evil.seoul.go.kr/photo.jpg",
  "https://seoul.go.kr.evil.test/photo.jpg",
  "https://127.0.0.1/photo.png",
  "https://[::1]/photo.png",
  "http://169.254.169.254/",
  "https://user:password@map.seoul.go.kr/photo.jpg",
  "https://map.seoul.go.kr:8443/photo.jpg",
  "file:///etc/passwd",
  "http://img.daum-kg.net/photo.png",
])("rejects an untrusted URL before any request: %s", async (url) => {
  const fetchImage = vi.fn<typeof fetch>();
  expect((await request(url, fetchImage)).status).toBe(400);
  expect(fetchImage).not.toHaveBeenCalled();
});

test("upgrades legacy HTTP heritage images to HTTPS", async () => {
  const fetchImage = vi.fn<typeof fetch>().mockResolvedValue(new Response(png));
  await request("http://futureheritage.seoul.go.kr/HeritageImg/photo.jpg", fetchImage);
  expect(fetchImage).toHaveBeenCalledWith(
    "https://futureheritage.seoul.go.kr/HeritageImg/photo.jpg",
    expect.objectContaining({ redirect: "manual", signal: expect.any(AbortSignal) })
  );
});

test("validates each redirect and never follows a private destination", async () => {
  const fetchImage = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(null, {
      status: 302,
      headers: { Location: "http://127.0.0.1/private" },
    })
  );
  expect((await request(mapPhoto, fetchImage)).status).toBe(502);
  expect(fetchImage).toHaveBeenCalledTimes(1);
  expect(fetchImage.mock.calls[0][1]?.redirect).toBe("manual");
});

test("follows an allowed relative redirect and strips cookies and stale encoding headers", async () => {
  const fetchImage = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: "/photo.png" } }))
    .mockResolvedValueOnce(
      new Response(png, {
        headers: {
          "Content-Type": "image/png",
          "Set-Cookie": "private=1",
          "Content-Encoding": "gzip",
        },
      })
    );
  const response = await request(mapPhoto, fetchImage);
  expect(response.status).toBe(200);
  expect(fetchImage.mock.calls[1][0]).toBe("https://map.seoul.go.kr/photo.png");
  expect(response.headers.has("Set-Cookie")).toBe(false);
  expect(response.headers.has("Content-Encoding")).toBe(false);
});

test("bounds redirect loops", async () => {
  const fetchImage = vi.fn<typeof fetch>().mockImplementation(
    async () =>
      new Response(null, {
        status: 302,
        headers: { Location: mapPhoto },
      })
  );
  expect((await request(mapPhoto, fetchImage)).status).toBe(502);
  expect(fetchImage).toHaveBeenCalledTimes(4);
});

test.each(["image/png", "text/html", "image/svg+xml"])(
  "rejects non-image bytes labeled %s",
  async (type) => {
    const fetchImage = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("<html>not a photo</html>", {
        headers: { "Content-Type": type },
      })
    );
    expect((await request(mapPhoto, fetchImage)).status).toBe(502);
  }
);

test("rejects a declared oversized response before reading it", async () => {
  const fetchImage = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(png, {
      headers: { "Content-Length": String(5 * 1024 * 1024 + 1), "Content-Type": "image/png" },
    })
  );
  expect((await request(mapPhoto, fetchImage)).status).toBe(502);
});

test("enforces the byte limit even without Content-Length", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(5 * 1024 * 1024 + 1));
    },
    cancel,
  });
  const fetchImage = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(body, {
      headers: { "Content-Type": "image/png" },
    })
  );
  expect((await request(mapPhoto, fetchImage)).status).toBe(502);
  expect(cancel).toHaveBeenCalledOnce();
});

test("turns certificate/network errors into a controlled failure without retrying insecurely", async () => {
  const fetchImage = vi.fn<typeof fetch>().mockRejectedValue(new Error("certificate failure"));
  expect((await request(mapPhoto, fetchImage)).status).toBe(502);
  expect(fetchImage).toHaveBeenCalledOnce();
});

test("aborts a stalled body as well as the initial request", async () => {
  vi.useFakeTimers();
  const cancel = vi.fn();
  const fetchImage = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(png);
        },
        cancel,
      }),
      { headers: { "Content-Type": "image/png" } }
    )
  );
  const pending = request(mapPhoto, fetchImage);
  await vi.advanceTimersByTimeAsync(10001);
  expect((await pending).status).toBe(504);
  expect(cancel).toHaveBeenCalledOnce();
});
