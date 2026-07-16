import { describe, expect, test } from "vitest";

import { toCharacterModelRotationRadians } from "./characterModelRotation";

describe("toCharacterModelRotationRadians", () => {
  test("keeps the existing exploration model rotation convention", () => {
    expect(toCharacterModelRotationRadians(Math.PI / 2)).toBe(-Math.PI / 2);
  });
});
