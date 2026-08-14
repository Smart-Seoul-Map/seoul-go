import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const fromRoot = (path) => resolve(fileURLToPath(new URL(".", import.meta.url)), path);
const SMART_SEOUL_TILE_PROXY_PATH = "/api/smart-seoul-map";
const SMART_SEOUL_TMS_TILE_BASE_PATH = "/tms";
const SMART_SEOUL_TMS_MAP_ID = "dawul_kor_normal_3857_20260223";
const SMART_SEOUL_TILE_ACCEPT_HEADER =
  "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const SMART_SEOUL_TMS_TILE_PATH_PATTERN = new RegExp(
  `^${SMART_SEOUL_TMS_TILE_BASE_PATH}/${SMART_SEOUL_TMS_MAP_ID}/\\d+/\\d+/\\d+\\.png$`
);

const rewriteSmartSeoulTileProxyPath = (path) => {
  const url = new URL(path, "http://localhost");
  const smartSeoulPath = url.pathname.slice(SMART_SEOUL_TILE_PROXY_PATH.length);
  if (SMART_SEOUL_TMS_TILE_PATH_PATTERN.test(smartSeoulPath)) {
    return smartSeoulPath;
  }
  return `${SMART_SEOUL_TMS_TILE_BASE_PATH}/invalid-smart-seoul-tile-request.png`;
};

export default defineConfig(() => {
  return {
    base: "/",
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
