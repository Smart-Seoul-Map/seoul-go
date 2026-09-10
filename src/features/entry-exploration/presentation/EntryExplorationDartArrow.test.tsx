import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { EntryExplorationDartThrowResult } from "../application/entryExplorationSeoulTileMapViewInteraction";
import { ENTRY_EXPLORATION_DART_CONFIG } from "../config/entryExplorationDartConfig";
import { EntryExplorationDartArrow } from "./EntryExplorationDartArrow";

type DartArrowState = {
  isVisible?: boolean;
  shot?: EntryExplorationDartThrowResult | null;
};

function createShot(): EntryExplorationDartThrowResult {
  return {
    cell: { column: 10, row: 10 },
    districtId: 1,
    gridNumber: "다사5253",
    viewportPoint: { x: 0.5, y: 0.5 },
  };
}

function advancePastFlight(): void {
  act(() => {
    vi.advanceTimersByTime(ENTRY_EXPLORATION_DART_CONFIG.flight.durationMs + 100);
  });
}

function renderDartArrow(onFlightEnd: () => void) {
  const view = ({ isVisible = true, shot = null }: DartArrowState) => (
    <EntryExplorationDartArrow
      isTargetHovered={false}
      isVisible={isVisible}
      onFlightEnd={onFlightEnd}
      shot={shot}
    />
  );
  const { rerender } = render(view({}));

  return (state: DartArrowState) => rerender(view(state));
}

describe("entry exploration dart arrow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("reports the flight end once per shot", () => {
    const onFlightEnd = vi.fn();
    const update = renderDartArrow(onFlightEnd);

    update({ shot: createShot() });
    advancePastFlight();
    advancePastFlight();

    expect(onFlightEnd).toHaveBeenCalledTimes(1);
  });

  test("reports the flight end again after leaving and re-entering the dart view", () => {
    const onFlightEnd = vi.fn();
    const update = renderDartArrow(onFlightEnd);

    update({ shot: createShot() });
    advancePastFlight();
    update({ isVisible: false });
    update({});
    update({ shot: createShot() });
    advancePastFlight();

    expect(onFlightEnd).toHaveBeenCalledTimes(2);
  });
});
