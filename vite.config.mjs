import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const fromRoot = (path) => resolve(fileURLToPath(new URL(".", import.meta.url)), path);

export default defineConfig({
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
  test: {
    environment: "jsdom",
  },
});
