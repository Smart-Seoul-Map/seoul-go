import { readdir, rename, rmdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { URL, fileURLToPath } from "node:url";

import { defineConfig, mergeConfig, normalizePath } from "vite";

import baseConfig from "../vite.config.mjs";

const EDITOR_DIR = fileURLToPath(new URL(".", import.meta.url));
const ROOT_DIR = resolve(EDITOR_DIR, "..");
const EDITOR_CACHE_DIR = "node_modules/.vite-intro-layout-editor";
const EDITOR_OUT_DIR = resolve(ROOT_DIR, "dist/seoul-go-editor");
const EDITOR_HTML_FILE = resolve(EDITOR_DIR, "index.html");
const EDITOR_HTML_PATH = normalizePath(relative(ROOT_DIR, EDITOR_HTML_FILE));
const EDITOR_INDEX_FILE = "index.html";
const EDITOR_TEST_INCLUDE = [
  `${normalizePath(relative(ROOT_DIR, EDITOR_DIR))}/src/**/*.test.{ts,tsx}`,
];
const ENTRY_INTRO_LAYOUT_ENDPOINT = "/__dev/entry-intro-layout";
const ENTRY_INTRO_LAYOUT_FILE = resolve(
  ROOT_DIR,
  "src/features/entry-exploration/config/entryIntroLayout.json"
);
const ENTRY_INTRO_LAYOUT_VALIDATION_MODULE =
  "/src/features/entry-exploration/domain/entryIntroLayoutValidation.ts";
const ENTRY_EXPLORATION_STICKER_DIR = resolve(ROOT_DIR, "src/assets/entry-exploration/stickers");
const STICKER_FILE_PATTERN = /\.(png|webp)$/;
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const readRequestBody = (request) =>
  new Promise((resolveBody, rejectBody) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolveBody(body));
    request.on("error", rejectBody);
  });

const isLocalRequest = (request) => {
  if (!LOOPBACK_ADDRESSES.has(request.socket.remoteAddress)) {
    return false;
  }

  const { origin } = request.headers;

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
};

const parseJson = (text) => {
  try {
    return { isValid: true, value: JSON.parse(text) };
  } catch {
    return { isValid: false, value: null };
  }
};

const readStickerAssets = async () => {
  try {
    return (await readdir(ENTRY_EXPLORATION_STICKER_DIR)).filter((name) =>
      STICKER_FILE_PATTERN.test(name)
    );
  } catch {
    return [];
  }
};

const sendStatus = (response, statusCode, message) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end(message);
};

const introLayoutEditorRootPage = () => ({
  name: "intro-layout-editor-root-page",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");

      if (url.pathname === "/") {
        request.url = `/${EDITOR_HTML_PATH}${url.search}`;
      }

      next();
    });
  },
});

const entryIntroLayoutWriter = () => ({
  name: "entry-intro-layout-writer",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use(ENTRY_INTRO_LAYOUT_ENDPOINT, async (request, response) => {
      if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        sendStatus(response, 405, "Only POST is allowed.");
        return;
      }

      if (!isLocalRequest(request)) {
        sendStatus(response, 403, "Only local same-origin requests are allowed.");
        return;
      }

      try {
        const next = parseJson(await readRequestBody(request));

        if (!next.isValid) {
          sendStatus(response, 400, "Request body is not valid JSON.");
          return;
        }

        const { validateEntryIntroLayoutDocument } = await server.ssrLoadModule(
          ENTRY_INTRO_LAYOUT_VALIDATION_MODULE
        );
        const errors = validateEntryIntroLayoutDocument(next.value, await readStickerAssets());

        if (errors.length) {
          sendStatus(response, 422, errors.join("\n"));
          return;
        }

        await writeFile(ENTRY_INTRO_LAYOUT_FILE, `${JSON.stringify(next.value, null, 2)}\n`);
        server.moduleGraph
          .getModulesByFile(normalizePath(ENTRY_INTRO_LAYOUT_FILE))
          ?.forEach((module) => server.moduleGraph.invalidateModule(module));
        response.statusCode = 204;
        response.end();
        server.ws.send({ type: "full-reload" });
      } catch {
        sendStatus(response, 500, "Layout file could not be written.");
      }
    });
  },
});

const introLayoutEditorIndex = () => ({
  name: "intro-layout-editor-index",
  apply: "build",
  async writeBundle({ dir }) {
    const builtHtmlFile = resolve(dir, EDITOR_HTML_PATH);

    await rename(builtHtmlFile, resolve(dir, EDITOR_INDEX_FILE));
    await rmdir(dirname(builtHtmlFile));
  },
});

export default defineConfig((env) => {
  const config = mergeConfig(baseConfig(env), {
    root: ROOT_DIR,
    cacheDir: EDITOR_CACHE_DIR,
    plugins: [introLayoutEditorRootPage(), entryIntroLayoutWriter(), introLayoutEditorIndex()],
    build: {
      outDir: EDITOR_OUT_DIR,
      emptyOutDir: true,
      rollupOptions: {
        input: EDITOR_HTML_FILE,
      },
    },
  });

  return { ...config, test: { ...config.test, include: EDITOR_TEST_INCLUDE } };
});
