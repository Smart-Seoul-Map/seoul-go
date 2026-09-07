import { afterEach, describe, expect, test } from "vitest";

import { getEntryExplorationIntroTheme } from "./entryExplorationIntroTheme";

describe("getEntryExplorationIntroTheme", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--sg-v3-blue-500");
    document.documentElement.style.removeProperty("--sg-v3-blue-600");
    document.documentElement.style.removeProperty("--sg-font-size-6");
    document.documentElement.style.removeProperty("--sg-button-primary-bg");
  });

  test("uses the same blue tokens as the screen intro button", () => {
    document.documentElement.style.setProperty("--sg-v3-blue-500", "#08b2f0");
    document.documentElement.style.setProperty("--sg-v3-blue-600", "#0082ff");
    document.documentElement.style.setProperty("--sg-font-size-6", "1.125rem");
    document.documentElement.style.setProperty("--sg-button-primary-bg", "#ff2b91");

    const theme = getEntryExplorationIntroTheme();

    expect(theme.button.activeColor).toBe("#08b2f0");
    expect(theme.button.activeShadowColor).toBe("#0082ff");
    expect(theme.button.fontSize).toBe(72);
  });
});
