import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_DART_CONFIG } from "../config/entryExplorationDartConfig";
import { EntryExplorationDartArrow } from "./EntryExplorationDartArrow";

const TARGET_POINT = { x: 0.5, y: 0.5 };

function advancePastFlight(): void {
  act(() => {
    vi.advanceTimersByTime(ENTRY_EXPLORATION_DART_CONFIG.flight.durationMs + 100);
  });
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
    const { rerender } = render(
      <EntryExplorationDartArrow
        isTargetHovered={false}
        isVisible
        onFlightEnd={onFlightEnd}
        shotId={null}
        targetPoint={null}
      />
    );

    rerender(
      <EntryExplorationDartArrow
        isTargetHovered={false}
        isVisible
        onFlightEnd={onFlightEnd}
        shotId={1}
        targetPoint={TARGET_POINT}
      />
    );
    advancePastFlight();

    expect(onFlightEnd).toHaveBeenCalledTimes(1);

    advancePastFlight();

    expect(onFlightEnd).toHaveBeenCalledTimes(1);
  });

  test("reports the flight end again after leaving and re-entering the dart view", () => {
    const onFlightEnd = vi.fn();
    const { rerender } = render(
      <EntryExplorationDartArrow
        isTargetHovered={false}
        isVisible
        onFlightEnd={onFlightEnd}
        shotId={1}
        targetPoint={TARGET_POINT}
      />
    );
    advancePastFlight();

    expect(onFlightEnd).toHaveBeenCalledTimes(1);

    rerender(
      <EntryExplorationDartArrow
        isTargetHovered={false}
        isVisible={false}
        onFlightEnd={onFlightEnd}
        shotId={null}
        targetPoint={null}
      />
    );
    rerender(
      <EntryExplorationDartArrow
        isTargetHovered={false}
        isVisible
        onFlightEnd={onFlightEnd}
        shotId={null}
        targetPoint={null}
      />
    );

    rerender(
      <EntryExplorationDartArrow
        isTargetHovered={false}
        isVisible
        onFlightEnd={onFlightEnd}
        shotId={1}
        targetPoint={TARGET_POINT}
      />
    );
    advancePastFlight();

    expect(onFlightEnd).toHaveBeenCalledTimes(2);
  });
});
