import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { getSeoulGridSelectableCells } from "../domain/seoulGridNumberLines";
import { createEntryExplorationDartRoulette } from "./entryExplorationDartRoulette";

const cells = getSeoulGridSelectableCells([52]);
const TOTAL_PLAY_TIME_MS = 60_000;

function createRoulette(getCells = () => cells) {
  const onHighlight = vi.fn();
  const onPicked = vi.fn();

  return {
    onHighlight,
    onPicked,
    roulette: createEntryExplorationDartRoulette({ getCells, onHighlight, onPicked }),
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
