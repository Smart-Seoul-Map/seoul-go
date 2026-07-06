import { describe, expect, test } from "vitest";

import { advanceMovement, createMovement } from "./explorationMovement";

const start = { lng: 126.9784147, lat: 37.5666805 };
const target = { lng: 126.975264, lat: 37.565804 };

describe("캐릭터 이동 상태", () => {
  test("목표 좌표를 향해 이동 중 상태를 만든다", () => {
    const movement = createMovement(start, target);

    expect(movement.status).toBe("moving");
    expect(movement.position).toEqual(start);
    expect(movement.target).toEqual(target);
  });

  test("프레임이 진행되면 목표 쪽으로 이동한다", () => {
    const movement = createMovement(start, target);
    const next = advanceMovement(movement, 1, 2);

    expect(next.status).toBe("moving");
    expect(next.position.lng).toBeLessThan(start.lng);
    expect(next.position.lat).toBeLessThan(start.lat);
  });

  test("도착 반경 안에 들어오면 arrived 상태로 고정한다", () => {
    const movement = createMovement(start, target, 350);
    const next = advanceMovement(movement, 1, 2);

    expect(next.status).toBe("arrived");
    expect(next.position).toEqual(target);
  });
});
