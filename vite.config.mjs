import { request as httpsRequest } from "node:https";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const fromRoot = (path) => resolve(fileURLToPath(new URL(".", import.meta.url)), path);

const SMART_SEOUL_TILE_PROXY_PATH = "/api/smart-seoul-map";
const SMART_SEOUL_PLACE_IMAGE_PROXY_PATH = "/api/place-image";
const SMART_SEOUL_TMS_TILE_BASE_PATH = "/tms";
const SMART_SEOUL_TMS_MAP_ID = "dawul_kor_normal_3857_20260526";
const SMART_SEOUL_TILE_ACCEPT_HEADER =
  "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const SMART_SEOUL_TMS_TILE_PATH_PATTERN = new RegExp(
  `^${SMART_SEOUL_TMS_TILE_BASE_PATH}/${SMART_SEOUL_TMS_MAP_ID}/\\d+/\\d+/\\d+\\.png$`
);
const SMART_SEOUL_PLACE_IMAGE_FUNCTION_PATH = "/functions/api/place-image.ts";
const PLACE_IMAGE_INCOMPLETE_CHAIN_ERROR_CODE = "UNABLE_TO_VERIFY_LEAF_SIGNATURE";
const PLACE_IMAGE_UNPIPED_HEADERS = new Set(["content-encoding", "content-length"]);

const rewriteSmartSeoulTileProxyPath = (path) => {
  const url = new URL(path, "http://localhost");
  const smartSeoulPath = url.pathname.slice(SMART_SEOUL_TILE_PROXY_PATH.length);

  if (SMART_SEOUL_TMS_TILE_PATH_PATTERN.test(smartSeoulPath)) {
    return smartSeoulPath;
  }

  return `${SMART_SEOUL_TMS_TILE_BASE_PATH}/invalid-smart-seoul-tile-request.png`;
};

const fetchWithoutCertificateCheck = (imageUrl, init) =>
  new Promise((resolve, reject) => {
    const imageRequest = httpsRequest(
      imageUrl,
      { headers: init?.headers ?? {}, rejectUnauthorized: false },
      (imageResponse) => {
        const chunks = [];

        imageResponse.on("data", (chunk) => chunks.push(chunk));
        imageResponse.on("end", () =>
          resolve(
            new Response(Buffer.concat(chunks), {
              status: imageResponse.statusCode,
              headers: { "Content-Type": imageResponse.headers["content-type"] ?? "" },
            })
          )
        );
      }
    );

    imageRequest.on("error", reject);
    imageRequest.end();
  });

const fetchPlaceImage = async (imageUrl, init) => {
  try {
    return await fetch(imageUrl, init);
  } catch (error) {
    if (error?.cause?.code !== PLACE_IMAGE_INCOMPLETE_CHAIN_ERROR_CODE) {
      throw error;
    }

    return fetchWithoutCertificateCheck(imageUrl, init);
  }
};

const smartSeoulPlaceImageProxy = () => ({
  name: "smart-seoul-place-image-proxy",
  configureServer(server) {
    server.middlewares.use(SMART_SEOUL_PLACE_IMAGE_PROXY_PATH, async (request, response) => {
      const requestUrl = new URL(request.originalUrl ?? request.url ?? "", "http://localhost");

      try {
        const { onRequestGet } = await server.ssrLoadModule(SMART_SEOUL_PLACE_IMAGE_FUNCTION_PATH);
        const imageResponse = await onRequestGet({
          env: { fetchPlaceImage },
          request: new Request(requestUrl),
        });

        response.statusCode = imageResponse.status;
        imageResponse.headers.forEach((value, name) => {
          if (!PLACE_IMAGE_UNPIPED_HEADERS.has(name)) {
            response.setHeader(name, value);
          }
        });
        response.end(Buffer.from(await imageResponse.arrayBuffer()));
      } catch {
        response.statusCode = 502;
        response.end("Place image request failed.");
      }
    });
  },
});

export default defineConfig(() => {
  return {
    base: "/",
    plugins: [react(), smartSeoulPlaceImageProxy()],
    resolve: {
      alias: {
        "@app": fromRoot("src/app"),
        "@features": fromRoot("src/features"),
        "@shared": fromRoot("src/shared"),
      },
    },
    build: {
      target: "es2022",
      assetsInlineLimit: 0,
    },
    server: {
      proxy: {
        [SMART_SEOUL_TILE_PROXY_PATH]: {
          target: "https://map.seoul.go.kr",
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Accept", SMART_SEOUL_TILE_ACCEPT_HEADER);
            });
          },
          rewrite: rewriteSmartSeoulTileProxyPath,
        },
      },
    },
    test: {
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
  };
});
