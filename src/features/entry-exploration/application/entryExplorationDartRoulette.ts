import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import type { SeoulGridCell } from "../domain/seoulGridNumber";
import { pickRandomSeoulGridCell } from "../domain/seoulGridRandomCell";

type EntryExplorationDartRouletteOptions = {
  getCells: () => readonly SeoulGridCell[];
  onHighlight: (cell: SeoulGridCell, step: number) => void;
  onPicked: (cell: SeoulGridCell) => void;
  onWin: (cell: SeoulGridCell) => void;
};

export type EntryExplorationDartRoulette = {
  cancel: () => void;
  isRunning: () => boolean;
  start: () => void;
};

const { steps } = ENTRY_EXPLORATION_DART_ROULETTE_CONFIG;

export function createEntryExplorationDartRoulette({
  getCells,
  onHighlight,
  onPicked,
  onWin,
}: EntryExplorationDartRouletteOptions): EntryExplorationDartRoulette {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const pickNextCell = (winner: SeoulGridCell, previous: SeoulGridCell | null): SeoulGridCell => {
    const candidates = getCells().filter((cell) => cell !== winner && cell !== previous);

    return pickRandomSeoulGridCell(Math.random, candidates) ?? winner;
  };

  const play = (winner: SeoulGridCell, previous: SeoulGridCell | null, shown: number): void => {
    if (shown === steps.count) {
      onWin(winner);
      timer = setTimeout(() => {
        timer = null;
        onPicked(winner);
      }, steps.winHoldMs);

      return;
    }

    const cell = shown === steps.count - 1 ? winner : pickNextCell(winner, previous);

    onHighlight(cell, shown);
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
  if (shown >= steps.count) {
    return steps.settleDelayMs;
  }

  if (shown <= steps.fastCount) {
    return steps.fastDelayMs;
  }

  const slowdownMs = (shown - steps.fastCount) ** steps.slowdownExponent * steps.slowdownBaseMs;

  return steps.fastDelayMs + slowdownMs;
}
