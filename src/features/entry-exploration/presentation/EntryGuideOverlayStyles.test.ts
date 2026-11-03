// @ts-expect-error Vitest runs this contract test in Node, while app TS excludes Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error Vitest runs this contract test in Node, while app TS excludes Node types.
import { join } from "node:path";
import { describe, expect, test } from "vitest";

// @ts-expect-error Vitest provides process at runtime for this CSS contract test.
const presentationDirectory = join(process.cwd(), "src/features/entry-exploration/presentation");

describe("EntryGuideOverlay styles", () => {
  test("centers the guide vertically at every width", () => {
    const css = readFileSync(join(presentationDirectory, "EntryGuideOverlay.css"), "utf8");
    const overlayRule = css.match(/\.entry-guide-overlay \{[^}]*\}/)?.[0];

    expect(overlayRule).toContain("align-items: center;");
    expect(css).not.toMatch(/align-items:\s*(flex-)?end/);
  });
});
