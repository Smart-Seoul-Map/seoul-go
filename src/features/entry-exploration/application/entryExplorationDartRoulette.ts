import type { SeoulGridCell } from "../domain/seoulGridNumber";
import { pickRandomSeoulGridCell } from "../domain/seoulGridRandomCell";

type EntryExplorationDartRouletteOptions = {
  getCells: () => readonly SeoulGridCell[];
  onHighlight: (cell: SeoulGridCell) => void;
  onPicked: (cell: SeoulGridCell) => void;
};

export type EntryExplorationDartRoulette = {
  cancel: () => void;
  isRunning: () => boolean;
  start: () => void;
};

const STEP_COUNT = 19;
const FAST_STEP_COUNT = 10;
const FAST_DELAY_MS = 75;
const SLOWDOWN_BASE_MS = 24;
const SLOWDOWN_EXPONENT = 1.65;
const SETTLE_DELAY_MS = 200;

export function createEntryExplorationDartRoulette({
  getCells,
  onHighlight,
  onPicked,
}: EntryExplorationDartRouletteOptions): EntryExplorationDartRoulette {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const pickNextCell = (winner: SeoulGridCell, previous: SeoulGridCell | null): SeoulGridCell => {
    const candidates = getCells().filter((cell) => cell !== winner && cell !== previous);

    return pickRandomSeoulGridCell(Math.random, candidates) ?? winner;
  };

  const play = (winner: SeoulGridCell, previous: SeoulGridCell | null, shown: number): void => {
    if (shown === STEP_COUNT) {
      timer = null;
      onPicked(winner);

      return;
    }

    const cell = shown === STEP_COUNT - 1 ? winner : pickNextCell(winner, previous);

    onHighlight(cell);
    timer = setTimeout(() => play(winner, cell, shown + 1), getStepDelayMs(shown + 1));
  };

  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = null;
  };

  const start = (): void => {
    const winner = pickRandomSeoulGridCell(Math.random, getCells());

    if (timer === null && winner) {
      play(winner, null, 0);
    }
  };

  return { cancel, isRunning: () => timer !== null, start };
}

function getStepDelayMs(shown: number): number {
  if (shown >= STEP_COUNT) {
    return SETTLE_DELAY_MS;
  }

  if (shown <= FAST_STEP_COUNT) {
    return FAST_DELAY_MS;
  }

  return FAST_DELAY_MS + (shown - FAST_STEP_COUNT) ** SLOWDOWN_EXPONENT * SLOWDOWN_BASE_MS;
}
