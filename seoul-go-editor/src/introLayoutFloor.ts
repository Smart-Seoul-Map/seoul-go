import { ENTRY_EXPLORATION_FLOOR_TEXTURE_URL } from "../../src/features/entry-exploration/config/entryExplorationSceneConfig";

export type IntroLayoutRgb = { r: number; g: number; b: number };

export type IntroLayoutFloorPattern = {
  id: string;
  label: string;
  url: string;
};

export type IntroLayoutFloorColors = {
  base: string;
  line: string;
};

export type IntroLayoutFloorCombo = IntroLayoutFloorColors & {
  patternId: string;
};

export type IntroLayoutFloorState = {
  patternId: string;
  colors: Readonly<Record<string, IntroLayoutFloorColors>>;
  combos: readonly IntroLayoutFloorCombo[];
};

const CANDIDATE_URLS_BY_PATH = import.meta.glob<string>(
  "../floor-candidates/*.{png,webp,jpg,jpeg}",
  { eager: true, import: "default", query: "?url" }
);
const FLOOR_STATE_STORAGE_KEY = "seoul-go:intro-layout-editor:floor";
const UPLOADED_FLOOR_PATTERN_ID_PREFIX = "upload:";
const SINGLE_COLOR_SHADE = 0.55;
const HEX_COLOR_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const INTRO_LAYOUT_CURRENT_FLOOR_PATTERN_ID = "current";

export const INTRO_LAYOUT_FLOOR_PATTERNS: readonly IntroLayoutFloorPattern[] = [
  {
    id: INTRO_LAYOUT_CURRENT_FLOOR_PATTERN_ID,
    label: "지금 앱 바닥",
    url: ENTRY_EXPLORATION_FLOOR_TEXTURE_URL,
  },
  ...Object.entries(CANDIDATE_URLS_BY_PATH)
    .map(([path, url]) => {
      const fileName = path.slice(path.lastIndexOf("/") + 1);

      return { id: fileName, label: removeFileExtension(fileName), url };
    })
    .sort((a, b) => a.label.localeCompare(b.label)),
];

export const EMPTY_INTRO_LAYOUT_FLOOR_COLORS: IntroLayoutFloorColors = { base: "", line: "" };

export function createIntroLayoutUploadedFloorPattern(
  fileName: string,
  url: string
): IntroLayoutFloorPattern {
  return {
    id: `${UPLOADED_FLOOR_PATTERN_ID_PREFIX}${fileName}`,
    label: removeFileExtension(fileName),
    url,
  };
}

export function isIntroLayoutUploadedFloorPattern(pattern: IntroLayoutFloorPattern): boolean {
  return pattern.id.startsWith(UPLOADED_FLOOR_PATTERN_ID_PREFIX);
}

export function parseIntroLayoutHexColor(value: string): IntroLayoutRgb | null {
  const match = HEX_COLOR_PATTERN.exec(value.trim());

  if (!match) return null;

  const hex =
    match[1].length === 3 ? [...match[1]].map((digit) => `${digit}${digit}`).join("") : match[1];

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

export function normalizeIntroLayoutHexColor(value: string): string {
  const color = parseIntroLayoutHexColor(value);

  if (!color) return "";

  return `#${[color.r, color.g, color.b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

export function recolorIntroLayoutPatternPixels(
  pixels: Uint8ClampedArray,
  base: IntroLayoutRgb,
  line: IntroLayoutRgb | null
): Uint8ClampedArray {
  const dark = line ?? {
    r: base.r * SINGLE_COLOR_SHADE,
    g: base.g * SINGLE_COLOR_SHADE,
    b: base.b * SINGLE_COLOR_SHADE,
  };
  const luminances: number[] = [];

  for (let index = 0; index < pixels.length; index += 4) {
    luminances.push(0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2]);
  }

  let min = Infinity;
  let max = -Infinity;

  luminances.forEach((luminance, pixel) => {
    if (pixels[pixel * 4 + 3] === 0) return;

    min = Math.min(min, luminance);
    max = Math.max(max, luminance);
  });

  const range = Number.isFinite(min) ? max - min : 0;
  const result = new Uint8ClampedArray(pixels.length);

  luminances.forEach((luminance, pixel) => {
    const ratio = range > 0 ? (luminance - min) / range : 1;
    const offset = pixel * 4;

    result[offset] = dark.r + (base.r - dark.r) * ratio;
    result[offset + 1] = dark.g + (base.g - dark.g) * ratio;
    result[offset + 2] = dark.b + (base.b - dark.b) * ratio;
    result[offset + 3] = pixels[offset + 3];
  });

  return result;
}

export async function createIntroLayoutFloorTextureUrl(
  pattern: IntroLayoutFloorPattern,
  colors: IntroLayoutFloorColors
): Promise<string> {
  const base = parseIntroLayoutHexColor(colors.base);

  if (!base) return pattern.url;

  const image = await loadImage(pattern.url);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return pattern.url;

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  imageData.data.set(
    recolorIntroLayoutPatternPixels(imageData.data, base, parseIntroLayoutHexColor(colors.line))
  );
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}

export function getIntroLayoutFloorFileName(
  pattern: IntroLayoutFloorPattern,
  colors: IntroLayoutFloorColors
): string {
  const parts = [
    "floor",
    pattern.label,
    normalizeIntroLayoutHexColor(colors.base).slice(1),
    normalizeIntroLayoutHexColor(colors.line).slice(1),
  ].filter(Boolean);

  return `${parts.join("-")}.png`;
}

export function readIntroLayoutFloorState(): IntroLayoutFloorState {
  const fallback: IntroLayoutFloorState = {
    patternId: INTRO_LAYOUT_CURRENT_FLOOR_PATTERN_ID,
    colors: {},
    combos: [],
  };

  try {
    const stored: unknown = JSON.parse(localStorage.getItem(FLOOR_STATE_STORAGE_KEY) ?? "null");

    if (typeof stored !== "object" || stored === null) return fallback;

    const state = stored as Partial<IntroLayoutFloorState>;
    const patternId = INTRO_LAYOUT_FLOOR_PATTERNS.some(({ id }) => id === state.patternId)
      ? String(state.patternId)
      : fallback.patternId;

    return {
      patternId,
      colors: typeof state.colors === "object" && state.colors !== null ? state.colors : {},
      combos: Array.isArray(state.combos) ? state.combos : [],
    };
  } catch {
    return fallback;
  }
}

export function writeIntroLayoutFloorState(state: IntroLayoutFloorState): void {
  try {
    localStorage.setItem(FLOOR_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

function removeFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Floor pattern could not be loaded: ${url}`));
    image.src = url;
  });
}
