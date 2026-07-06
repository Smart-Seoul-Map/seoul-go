import { describe, expect, test } from "vitest";

import { createMovement } from "../domain/explorationMovement";
import { advanceTrackedMovement, selectCharacterModelKey } from "./explorationMovementFrame";

const start = { lng: 126.9784147, lat: 37.5666805 };
const target = { lng: 126.975264, lat: 37.565804 };

describe("지도 추적 이동 프레임", () => {
  test("이동 중에는 run 모델과 다음 지도 중심 좌표를 만든다", () => {
    const movement = createMovement(start, target);
    const frame = advanceTrackedMovement(movement, 1, 2);

    expect(frame.modelKey).toBe("run");
    expect(frame.cameraCenter.lng).toBeLessThan(start.lng);
    expect(frame.cameraCenter.lat).toBeLessThan(start.lat);
  });

  test("도착하면 idle 모델과 목표 좌표 중심을 만든다", () => {
    const movement = createMovement(start, target, 350);
    const frame = advanceTrackedMovement(movement, 1, 2);

    expect(frame.modelKey).toBe("idlePrimary");
    expect(frame.cameraCenter).toEqual(target);
  });

  test("상태별 캐릭터 모델을 고른다", () => {
    expect(selectCharacterModelKey("idle")).toBe("idlePrimary");
    expect(selectCharacterModelKey("moving")).toBe("run");
    expect(selectCharacterModelKey("arrived")).toBe("idlePrimary");
  });
});
