import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import { getSeoulGridSelectableCells } from "../domain/seoulGridNumberLines";
import { createEntryExplorationDartRoulette } from "./entryExplorationDartRoulette";

const cells = getSeoulGridSelectableCells([52]);
const TOTAL_PLAY_TIME_MS = 60_000;

function createRoulette(getCells = () => cells) {
  const onHighlight = vi.fn();
  const onPicked = vi.fn();
  const onWin = vi.fn();

  return {
    onHighlight,
    onPicked,
    onWin,
    roulette: createEntryExplorationDartRoulette({ getCells, onHighlight, onPicked, onWin }),
  };
}

describe("entry exploration dart roulette", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("ends on the last highlighted cell", () => {
    const { onHighlight, onPicked, roulette } = createRoulette();

    roulette.start();

    expect(roulette.isRunning()).toBe(true);

    vi.advanceTimersByTime(TOTAL_PLAY_TIME_MS);

    expect(onPicked).toHaveBeenCalledTimes(1);
    expect(onPicked).toHaveBeenCalledWith(onHighlight.mock.calls.at(-1)?.[0]);
    expect(roulette.isRunning()).toBe(false);
  });

  test("announces the winner and holds it before picking", () => {
    const { onHighlight, onPicked, onWin, roulette } = createRoulette();
    const { count, winHoldMs } = ENTRY_EXPLORATION_DART_ROULETTE_CONFIG.steps;

    roulette.start();

    for (let step = 0; step < count; step += 1) {
      vi.advanceTimersToNextTimer();
    }

    const winner = onHighlight.mock.calls.at(-1)?.[0];

    expect(onHighlight.mock.calls.map(([, step]) => step)).toEqual([...Array(count).keys()]);
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onWin).toHaveBeenCalledWith(winner);
    expect(onPicked).not.toHaveBeenCalled();
    expect(roulette.isRunning()).toBe(true);

    vi.advanceTimersByTime(winHoldMs - 1);

    expect(onPicked).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(onPicked).toHaveBeenCalledWith(winner);
    expect(roulette.isRunning()).toBe(false);
  });

  test("ignores start while running", () => {
    const { onPicked, roulette } = createRoulette();

    roulette.start();
    roulette.start();
    vi.advanceTimersByTime(TOTAL_PLAY_TIME_MS);

    expect(onPicked).toHaveBeenCalledTimes(1);
  });

  test("does not pick after cancel", () => {
    const { onPicked, roulette } = createRoulette();

    roulette.start();
    roulette.cancel();
    vi.advanceTimersByTime(TOTAL_PLAY_TIME_MS);

    expect(onPicked).not.toHaveBeenCalled();
  });

  test("does nothing without cells", () => {
    const { onHighlight, roulette } = createRoulette(() => []);

    roulette.start();

    expect(onHighlight).not.toHaveBeenCalled();
    expect(roulette.isRunning()).toBe(false);
  });
});
