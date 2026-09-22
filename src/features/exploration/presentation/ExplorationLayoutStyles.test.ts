// @ts-expect-error Vitest runs this contract test in Node, while app TS excludes Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error Vitest runs this contract test in Node, while app TS excludes Node types.
import { join } from "node:path";
import { describe, expect, test } from "vitest";

// @ts-expect-error Vitest provides process at runtime for this CSS contract test.
const presentationDirectory = join(process.cwd(), "src/features/exploration/presentation");

function readPresentationStyle(fileName: string): string {
  return readFileSync(join(presentationDirectory, fileName), "utf8");
}

describe("Exploration layout styles", () => {
  test("keeps the mobile joystick above the device safe area", () => {
    const css = readPresentationStyle("ExplorationMap.css");

    expect(css).toContain("bottom: calc(var(--sg-spacing-6) + var(--sg-safe-area-bottom));");
  });

  test("hides the horizontal scrollbar from the map badge rail", () => {
    const css = readPresentationStyle("ExplorationPage.css");

    expect(css).toContain("scrollbar-width: none;");
    expect(css).toContain(".exploration-theme-place-count-list::-webkit-scrollbar");
    expect(css).toContain("display: none;");
  });
});
