import { describe, expect, test } from "vitest";

import { createMovement } from "../domain/explorationMovement";
import {
  advanceTrackedMovement,
  calculateCharacterHeadingRadians,
  selectCharacterModelKey,
} from "./explorationMovementFrame";

const start = { lng: 126.9784147, lat: 37.5666805 };
const target = { lng: 126.975264, lat: 37.565804 };

describe("tracked exploration movement frame", () => {
  test("uses the run model and next camera center while moving", () => {
    const movement = createMovement(start, target);
    const frame = advanceTrackedMovement(movement, 1, 2);

    expect(frame.modelKey).toBe("run");
    expect(frame.cameraCenter.lng).toBeLessThan(start.lng);
    expect(frame.cameraCenter.lat).toBeLessThan(start.lat);
  });

  test("uses the idle model without snapping the camera center after arrival", () => {
    const movement = createMovement(start, target, 350);
    const frame = advanceTrackedMovement(movement, 1, 2);

    expect(frame.modelKey).toBe("idlePrimary");
    expect(frame.cameraCenter).toEqual(start);
  });

  test("selects the character model by movement status", () => {
    expect(selectCharacterModelKey("idle")).toBe("idlePrimary");
    expect(selectCharacterModelKey("moving")).toBe("run");
    expect(selectCharacterModelKey("arrived")).toBe("idlePrimary");
  });

  test("eastward movement turns the character toward the right side of the map", () => {
    expect(
      calculateCharacterHeadingRadians(start, { ...start, lng: start.lng + 0.01 })
    ).toBeCloseTo(-Math.PI / 2);
  });

  test("map bearing offsets the character heading", () => {
    expect(
      calculateCharacterHeadingRadians(start, { ...start, lat: start.lat + 0.01 }, -30)
    ).toBeCloseTo((-5 * Math.PI) / 6);
  });
});
