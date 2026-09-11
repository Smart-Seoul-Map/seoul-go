const DEFAULT_ROOT_FONT_SIZE_PX = 16;

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
  fontFamily: string;
  guideColor: string;
};

export function getEntryExplorationIntroTheme(): EntryExplorationIntroTheme {
  return {
    button: {
      activeColor: readCssToken("--sg-v3-blue-500", "#08b2f0"),
      activeShadowColor: readCssToken("--sg-v3-blue-600", "#0082ff"),
      disabledColor: readCssToken("--sg-button-disabled-bg", "#f3f4f5"),
      disabledTextColor: readCssToken("--sg-button-disabled-fg", "#d1d3d8"),
      fontSize: readScaledCssLength("--sg-font-size-6", 18, INTRO_BUTTON_PIXEL_RATIO),
      fontWeight: readCssToken("--sg-typography-button-label-font-weight", "700"),
      radius: readScaledCssLength("--sg-radius-full", 35, INTRO_BUTTON_PIXEL_RATIO),
      textColor: readCssToken("--sg-button-primary-fg", "#ffffff"),
    },
    fontFamily: getComputedStyle(document.body).fontFamily,
    guideColor: readCssToken("--sg-v3-pink-500", "#ff2e94"),
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
