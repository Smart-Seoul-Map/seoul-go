const DEFAULT_ROOT_FONT_SIZE_PX = 16;

const INTRO_COPY_TITLE_PIXEL_RATIO = 2.5;
const INTRO_COPY_BODY_PIXEL_RATIO = 2.75;
const INTRO_BUTTON_PIXEL_RATIO = 4;

type EntryExplorationIntroTheme = {
  button: {
    activeColor: string;
    activeShadowColor: string;
    disabledColor: string;
    disabledTextColor: string;
    fontSize: number;
    fontWeight: string;
    radius: number;
    textColor: string;
  };
  copy: {
    bodyColor: string;
    bodyFontSize: number;
    bodyFontWeight: string;
    titleColor: string;
    titleFontSize: number;
    titleFontWeight: string;
  };
  fontFamily: string;
};

export function getEntryExplorationIntroTheme(): EntryExplorationIntroTheme {
  return {
    button: {
      activeColor: readCssToken("--sg-button-primary-bg", "#ff6600"),
      activeShadowColor: readCssToken("--sg-button-primary-bg-pressed", "#e14d00"),
      disabledColor: readCssToken("--sg-button-disabled-bg", "#f3f4f5"),
      disabledTextColor: readCssToken("--sg-button-disabled-fg", "#d1d3d8"),
      fontSize: readScaledCssLength(
        "--sg-typography-button-label-font-size",
        14,
        INTRO_BUTTON_PIXEL_RATIO
      ),
      fontWeight: readCssToken("--sg-typography-button-label-font-weight", "700"),
      radius: readScaledCssLength("--sg-button-radius", 8, INTRO_BUTTON_PIXEL_RATIO),
      textColor: readCssToken("--sg-button-primary-fg", "#ffffff"),
    },
    copy: {
      bodyColor: readCssToken("--sg-color-text-muted", "#555d6d"),
      bodyFontSize: readScaledCssLength(
        "--sg-typography-body-font-size",
        16,
        INTRO_COPY_BODY_PIXEL_RATIO
      ),
      bodyFontWeight: readCssToken("--sg-typography-body-font-weight", "400"),
      titleColor: readCssToken("--sg-color-text-default", "#1a1c20"),
      titleFontSize: readScaledCssLength(
        "--sg-typography-result-title-font-size",
        22,
        INTRO_COPY_TITLE_PIXEL_RATIO
      ),
      titleFontWeight: readCssToken("--sg-typography-result-title-font-weight", "700"),
    },
    fontFamily: getComputedStyle(document.body).fontFamily,
  };
}

function readScaledCssLength(tokenName: string, fallbackPx: number, ratio: number): number {
  const value = readCssToken(tokenName, `${fallbackPx}px`);
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const normalizedRootFontSize = Number.isFinite(rootFontSize)
    ? rootFontSize
    : DEFAULT_ROOT_FONT_SIZE_PX;
  const pixels = value.endsWith("rem")
    ? Number.parseFloat(value) * normalizedRootFontSize
    : Number.parseFloat(value);

  return (Number.isFinite(pixels) ? pixels : fallbackPx) * ratio;
}

function readCssToken(tokenName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();

  return value || fallback;
}
