import { describe, expect, test } from "vitest";

import { grantEntryNumberReward, revealEntryNumberReward } from "./entryNumberReward";

describe("entry number rewards", () => {
  test("draws every integer from 36 through 71 from equally sized intervals", () => {
    const results = Array.from({ length: 36 }, (_, index) => {
      const [reward] = grantEntryNumberReward([], "hanok", () => (index + 0.5) / 36);
      return reward.number;
    });
    expect(results).toEqual(Array.from({ length: 36 }, (_, index) => 36 + index));
  });

  test("excludes owned numbers and preserves acquisition order", () => {
    const first = grantEntryNumberReward([], "hanok", () => 0);
    const second = grantEntryNumberReward(first, "tower", () => 0);
    expect(second).toEqual([
      { placeId: "hanok", number: 36, revealed: false },
      { placeId: "tower", number: 37, revealed: false },
    ]);
    expect(first).toHaveLength(1);
  });

  test("returns the same reward without drawing again on a repeat visit", () => {
    const first = grantEntryNumberReward([], "hanok", () => 0);
    expect(
      grantEntryNumberReward(first, "hanok", () => {
        throw new Error("redraw");
      })
    ).toBe(first);
  });

  test("retains at most ten distinct place rewards", () => {
    let rewards = grantEntryNumberReward([], "place-0", () => 0);
    for (let index = 1; index <= 10; index++) {
      rewards = grantEntryNumberReward(rewards, `place-${index}`, () => 0);
    }
    expect(rewards.map(({ number }) => number)).toEqual([36, 37, 38, 39, 40, 41, 42, 43, 44, 45]);
    expect(rewards.some(({ placeId }) => placeId === "place-10")).toBe(false);
  });

  test("reveals a saved result without replacing its number or other rewards", () => {
    const first = grantEntryNumberReward([], "hanok", () => 0);
    const rewards = grantEntryNumberReward(first, "tower", () => 0.999);
    const revealed = revealEntryNumberReward(rewards, "hanok");
    expect(revealed).toEqual([
      { placeId: "hanok", number: 36, revealed: true },
      { placeId: "tower", number: 71, revealed: false },
    ]);
    expect(revealEntryNumberReward(revealed, "hanok")).toBe(revealed);
    expect(revealEntryNumberReward(revealed, "missing")).toBe(revealed);
    expect(rewards[0].revealed).toBe(false);
  });
});
