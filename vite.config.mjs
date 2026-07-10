import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const fromRoot = (path) => resolve(fileURLToPath(new URL(".", import.meta.url)), path);

const SMART_SEOUL_TILE_PROXY_PATH = "/api/smart-seoul-map";
const SMART_SEOUL_TILE_BASE_PATH = "/openapi/v5";
const SMART_SEOUL_MAP_KIND = "base";
const SMART_SEOUL_MAP_ID = "dawul_kor_normal";
const SMART_SEOUL_TILE_ACCEPT_HEADER =
  "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const SMART_SEOUL_TILE_PATH_PATTERN = new RegExp(
  `^/public/map/${SMART_SEOUL_MAP_KIND}/${SMART_SEOUL_MAP_ID}/\\d+/\\d+/\\d+/\\d+/\\d+/png$`
);

const rewriteSmartSeoulTileProxyPath = (path, apiKey) => {
  if (!apiKey) {
    return `${SMART_SEOUL_TILE_BASE_PATH}/invalid-smart-seoul-tile-request`;
  }

  const url = new URL(path, "http://localhost");
  const smartSeoulPath = url.pathname.slice(SMART_SEOUL_TILE_PROXY_PATH.length);

  if (!SMART_SEOUL_TILE_PATH_PATTERN.test(smartSeoulPath)) {
    return `${SMART_SEOUL_TILE_BASE_PATH}/invalid-smart-seoul-tile-request`;
  }

  return `${SMART_SEOUL_TILE_BASE_PATH}/${encodeURIComponent(apiKey)}${smartSeoulPath}`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const smartSeoulMapKey = env.SMART_SEOUL_MAP_KEY ?? env.VITE_SMART_SEOUL_MAP_KEY ?? "";

  return {
    base: "./",
    plugins: [react()],
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
          rewrite: (path) => rewriteSmartSeoulTileProxyPath(path, smartSeoulMapKey),
        },
      },
    },
    test: {
      environment: "jsdom",
    },
  };
});
